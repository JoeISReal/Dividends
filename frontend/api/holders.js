import { Connection, PublicKey } from '@solana/web3.js';

export default async function handler(req, res) {
    // 1. CORS Headers (Permissive for dashboard)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const MINT = "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";
        const RPC = "https://api.mainnet-beta.solana.com";

        const connection = new Connection(RPC, 'confirmed');
        const largest = await connection.getTokenLargestAccounts(new PublicKey(MINT));
        const accounts = largest.value || [];

        // Map to expected format
        const result = accounts.slice(0, 50).map((acc, index) => ({
            rank: index + 1,
            wallet: acc.address.toString(),
            displayWallet: acc.address.toString().slice(0, 4) + '...' + acc.address.toString().slice(-4),
            balance: acc.uiAmount,
            balanceApprox: acc.uiAmount,
            tier: 'MEMBER'
        }));

        res.status(200).json(result);
    } catch (error) {
        console.error("Lifeboat Error:", error);
        res.status(500).json({ error: error.message });
    }
}
