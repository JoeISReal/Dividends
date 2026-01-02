
import { Connection, PublicKey } from '@solana/web3.js';

// The Alchemy URL hardcoded in the service
const RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/GOu50-6Y3sqi0q3AdLMFq";
const MINT = "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";

async function testLimits() {
    console.log(`Using RPC: ${RPC_URL}`);
    const conn = new Connection(RPC_URL, 'confirmed');

    console.log("Requesting Top 100 via getTokenLargestAccounts...");
    try {
        // Explicitly asking for 100 (if supported)
        /* 
           Note: web3.js getTokenLargestAccounts signature might not take a limit config?
           Let's check the raw JSON-RPC behavior if standard method fails.
        */
        const accounts = await conn.getTokenLargestAccounts(new PublicKey(MINT));

        console.log(`Standard Call Result Count: ${accounts.value?.length}`);

        // If web3.js doesn't expose the limit param easily (it's often fixed to 20 in older versions or method spec),
        // we might not be passing it?
        // Actually, the Solana JSON RPC method 'getTokenLargestAccounts' DOES NO take a limit parameter in the standard mainnet version.
        // It says "Returns the 20 largest token accounts..."

    } catch (e) {
        console.error("Error:", e.message);
    }
}

testLimits();
