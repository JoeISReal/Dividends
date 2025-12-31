import { Connection, PublicKey } from '@solana/web3.js';

export default async function handler(req, res) {
    // 1. CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Or specific origin
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const MINT = "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";
        const RPC = "https://api.mainnet-beta.solana.com";

        // 2. Connect & Fetch
        // Use a simple specialized connection or fetch directly if lightweight needed, 
        // but web3.js is available in this environment (Node.js).
        const connection = new Connection(RPC, 'confirmed');

        const largest = await connection.getTokenLargestAccounts(new PublicKey(MINT));
        const accounts = largest.value || [];

        // 3. Map to Expected Format
        // Frontend expects: { wallet: string, balanceApprox: number }
        const result = accounts.slice(0, 50).map(acc => ({
            wallet: acc.address.toString(),
            balanceApprox: acc.uiAmount,
            tier: 'MEMBER' // Placeholder, frontend calcs or just displays balance
        }));

        res.status(200).json(result);

    } catch (error) {
        console.error("Lifeboat Error:", error);
        res.status(500).json({ error: error.message });
    }
}
