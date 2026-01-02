
import { Connection, PublicKey } from '@solana/web3.js';

// const RPC_URL = "https://api.mainnet-beta.solana.com"; 
const RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/GOu50-6Y3sqi0q3AdLMFq";

const MINT = "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";

async function testRPC() {
    console.log(`Testing RPC: ${RPC_URL}`);
    const conn = new Connection(RPC_URL, 'confirmed');

    try {
        const info = await conn.getParsedAccountInfo(new PublicKey(MINT));
        console.log(" Mint Found:", !!info.value);
    } catch (e) {
        console.error(" Mint Check Failed:", e.message);
    }

    // Light Scan Test
    try {
        console.log("Testing getTokenLargestAccounts (Light Scan)...");
        const accounts = await conn.getTokenLargestAccounts(new PublicKey(MINT));
        console.log(` Light Scan Success. Count: ${accounts.value?.length}`);
    } catch (e) {
        console.error(" Light Scan Failed:", e.message);
    }

    // Heavy Scan Input Test (getProgramAccounts)
    try {
        console.log("Testing getProgramAccounts (Heavy Scan) - Raw...");
        const accounts = await conn.getProgramAccounts(new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), {
            filters: [
                { dataSize: 165 }, // SPL Token Account Size
                { memcmp: { offset: 0, bytes: MINT } },
            ],
            encoding: 'base64'
        });
        console.log(` Heavy Scan Success. Count: ${accounts.length}`);
    } catch (e) {
        console.error(" Heavy Scan Failed:", e.message);
    }
}

testRPC();
