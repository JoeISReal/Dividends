import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import bs58 from 'bs58';

/**
 * ARCHITECTURAL RULE: LIVE ACTION ONLY
 * This service is for USER-INITIATED actions that require LIVE chain state.
 * 
 * ✅ ALLOWED: Transaction creation, Signature verification, Wallet-specific rent checks.
 * ❌ FORBIDDEN: General analytics, Top Holder lists, Global Stats. (Use snapshotService)
 */

// --- CONFIGURATION ---
const RPC_ENDPOINTS = [
    process.env.HELIUS_RPC_URL,
    "https://solana-mainnet.g.alchemy.com/v2/GOu50-6Y3sqi0q3AdLMFq", // Fallback 1
    "https://solana-mainnet.rpc.extrnode.com",                        // Fallback 2
    "https://api.mainnet-beta.solana.com"                             // Fallback 3
].filter(Boolean);

let currentRpcIndex = 0;
let connection = new Connection(RPC_ENDPOINTS[0], 'confirmed');

const DIVIDENDS_MINT = process.env.DIVIDENDS_MINT || "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

// --- CORE INFRASTRUCTURE ---

/**
 * Returns the active connection URL (for debugging/metadata).
 */
export function getActiveEndpoint() {
    return RPC_ENDPOINTS[currentRpcIndex];
}

/**
 * Rotates the RPC endpoint and recreates the Connection object.
 */
function rotateConnection() {
    currentRpcIndex = (currentRpcIndex + 1) % RPC_ENDPOINTS.length;
    const newEndpoint = RPC_ENDPOINTS[currentRpcIndex];
    console.warn(`[SolanaService] ⚠️ RPC Failover. Switching to ${newEndpoint}`);
    connection = new Connection(newEndpoint, 'confirmed');
}

/**
 * Executes a function with automatic failover and retries.
 * @param {Function} operation - Function that takes (connection) as argument
 */
async function executeWithRetry(operation, retries = 1) {
    for (let i = 0; i <= retries; i++) {
        try {
            return await operation(connection);
        } catch (e) {
            console.error(`[SolanaService] Error (Attempt ${i + 1}/${retries + 1}):`, e.message);
            if (i === retries) throw e;
            rotateConnection();
        }
    }
}

// --- PUBLIC METHODS ---


/**
 * STRATEGY 1: Heavy Scan (All Holders) using getParsedProgramAccounts
 * NOTE: Often blocked by public RPCs.
 */
export async function getAllHolders(mintAddress = DIVIDENDS_MINT) {
    return executeWithRetry(async (conn) => {
        // Short timeout for heavy call to fail fast so we can fallback in the caller if needed
        const accounts = await Promise.race([
            conn.getParsedProgramAccounts(
                TOKEN_PROGRAM_ID,
                {
                    filters: [
                        { dataSize: 165 },
                        { memcmp: { offset: 0, bytes: mintAddress } },
                    ],
                }
            ),
            new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), 15000))
        ]);

        return accounts.map(a => ({
            wallet: a.account.data.parsed.info.owner,
            balance: a.account.data.parsed.info.tokenAmount.uiAmount,
            tokenAccount: a.pubkey.toString()
        })).filter(h => h.balance > 0);
    });
}

/**
 * STRATEGY 2: Light Scan (Top 20-50 Holders) using getTokenLargestAccounts
 * Very reliable on public RPCs. 
 * Resolves Owner addresses automatically.
 */
export async function getTopHolders(mintAddress = DIVIDENDS_MINT, limit = 50) {
    return executeWithRetry(async (conn) => {
        const mint = new PublicKey(mintAddress);
        // 1. Get Largest Token Accounts
        const accounts = await conn.getTokenLargestAccounts(mint);

        if (!accounts.value || accounts.value.length === 0) return [];

        const topAccounts = accounts.value.slice(0, limit);
        const pubkeys = topAccounts.map(a => a.address);

        // 2. Resolve Owners
        const accountInfos = await conn.getMultipleAccountsInfo(pubkeys);

        const results = [];
        topAccounts.forEach((acc, i) => {
            const info = accountInfos[i];
            if (!info || info.data.length < 64) return;

            // SPL Token Layout: Mint(0-32) | Owner(32-64) | Amount(64-72) ...
            const owner = new PublicKey(info.data.slice(32, 64)).toBase58();

            results.push({
                wallet: owner,
                balance: acc.uiAmount,
                tokenAccount: acc.address.toString()
            });
        });

        return results;
    });
}

/**
 * Fetch Mint Supply and other Info
 */
export async function getMintInfo(mintAddress = DIVIDENDS_MINT) {
    return executeWithRetry(async (conn) => {
        const info = await conn.getParsedAccountInfo(new PublicKey(mintAddress));
        if (info.value?.data?.parsed?.info) {
            return info.value.data.parsed.info; // { supply, decimals, ... }
        }
        return null;
    });
}

/**
 * Scans a wallet for empty Token Accounts (Legacy & Token-2022).
 * ACTION-CRITICAL: Uses current connection but safe to retry.
 */
export async function getReclaimableAccounts(walletAddress) {
    return executeWithRetry(async (conn) => {
        const owner = new PublicKey(walletAddress);

        // Parallel fetch for both programs
        const [legacyAccounts, token2022Accounts] = await Promise.all([
            conn.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }),
            conn.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID })
        ]);

        const reclaimable = [];

        // Helper to process list
        const processAccounts = (list, programId) => {
            if (!list || !list.value) return;
            for (const { pubkey, account } of list.value) {
                const parsedInfo = account.data.parsed.info;
                const uiAmount = parsedInfo.tokenAmount.uiAmount;
                const amountRaw = parsedInfo.tokenAmount.amount; // "0" string check

                // Check for empty accounts
                if (uiAmount === 0 || amountRaw === "0") {
                    // Standard Rent ~0.002039 SOL
                    const rentSol = 0.00203928;

                    reclaimable.push({
                        pubkey: pubkey.toString(),
                        mint: parsedInfo.mint,
                        programId: programId.toString(),
                        program: programId.equals(TOKEN_PROGRAM_ID) ? 'spl-token' : 'token-2022',
                        rentSol: rentSol
                    });
                }
            }
        };

        processAccounts(legacyAccounts, TOKEN_PROGRAM_ID);
        processAccounts(token2022Accounts, TOKEN_2022_PROGRAM_ID);

        return {
            totalSol: reclaimable.reduce((acc, accInfo) => acc + accInfo.rentSol, 0),
            count: reclaimable.length,
            accounts: reclaimable,
            debug: {
                scannedLegacy: legacyAccounts.value?.length || 0,
                scanned2022: token2022Accounts.value?.length || 0
            }
        };
    });
}

/**
 * Creates a transaction to close specified accounts.
 * ACTION-CRITICAL
 */
export async function createReclaimTransaction(walletAddress, accountPubkeys) {
    return executeWithRetry(async (conn) => {
        if (!accountPubkeys || accountPubkeys.length === 0) throw new Error("No accounts specified");

        const owner = new PublicKey(walletAddress);
        const tx = new Transaction();

        // Limit chunk size (first 20)
        const safeChunk = accountPubkeys.slice(0, 20);

        const chunkKeys = safeChunk.map(k => new PublicKey(k));
        const accountInfos = await conn.getMultipleAccountsInfo(chunkKeys);

        for (let i = 0; i < chunkKeys.length; i++) {
            const accountPubkey = chunkKeys[i];
            const info = accountInfos[i];

            if (!info) continue;

            const programId = info.owner; // Program ID from account info

            // CloseAccount Instruction 
            const keys = [
                { pubkey: accountPubkey, isSigner: false, isWritable: true },
                { pubkey: owner, isSigner: false, isWritable: true },
                { pubkey: owner, isSigner: true, isWritable: false }
            ];

            const data = Buffer.from([9]); // CloseAccount Opcode

            const ix = new TransactionInstruction({
                keys,
                programId: programId,
                data
            });

            tx.add(ix);
        }

        const { blockhash } = await conn.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = owner;

        const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
        // Use standard base64 for ease
        return {
            transaction: serialized.toString('base64'),
            count: safeChunk.length,
            remaining: Math.max(0, accountPubkeys.length - safeChunk.length)
        };
    });
}
