
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import bs58 from 'bs58';

const HELIUS_RPC = process.env.HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com";
const connection = new Connection(HELIUS_RPC, 'confirmed');

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

/**
 * Scans a wallet for empty Token Accounts (Legacy & Token-2022).
 */
export async function getReclaimableAccounts(walletAddress) {
    try {
        const owner = new PublicKey(walletAddress);

        // Parallel fetch for both programs
        const [legacyAccounts, token2022Accounts] = await Promise.all([
            connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }),
            connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID })
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
                        programId: programId.toString(), // Store correct program ID
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

    } catch (e) {
        console.error("Rent Scan Error:", e);
        throw new Error("Failed to scan wallet");
    }
}

/**
 * Creates a transaction to close specified accounts.
 */
export async function createReclaimTransaction(walletAddress, accountPubkeys) {
    if (!accountPubkeys || accountPubkeys.length === 0) throw new Error("No accounts specified");

    const owner = new PublicKey(walletAddress);
    const tx = new Transaction();

    // Limit chunk size (first 20)
    const safeChunk = accountPubkeys.slice(0, 20);

    // We need to know the Program ID for each account to close it correctly.
    // Optimization: We could have the frontend pass it back, but let's just fetch it quickly 
    // to be robust against "blind" lists.
    const chunkKeys = safeChunk.map(k => new PublicKey(k));
    const accountInfos = await connection.getMultipleAccountsInfo(chunkKeys);

    for (let i = 0; i < chunkKeys.length; i++) {
        const accountPubkey = chunkKeys[i];
        const info = accountInfos[i];

        if (!info) continue;

        // info.owner is the Program ID (Token or Token-2022)
        const programId = info.owner;

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

    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = owner;

    const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
    return {
        transaction: serialized.toString('base64'),
        count: safeChunk.length,
        remaining: Math.max(0, accountPubkeys.length - safeChunk.length)
    };
}
