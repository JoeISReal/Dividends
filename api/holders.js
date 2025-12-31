// ZERO-DEPENDENCY LIFEBOAT
export default async function handler(req, res) {
    // 1. CORS Headers
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

    const MINT = "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";

    // Using a reliable public RPC list
    const RPC_LIST = [
        "https://api.mainnet-beta.solana.com",
        "https://solana-mainnet.rpc.extrnode.com",
        "https://rpc.ankr.com/solana"
    ];

    const payload = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenLargestAccounts",
        params: [
            MINT,
            { commitment: "confirmed" }
        ]
    });

    let lastError = null;

    for (const rpc of RPC_LIST) {
        try {
            // Native Fetch (available in Node 18+ Vercel Runtime)
            const response = await fetch(rpc, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const json = await response.json();
            if (json.error) throw new Error(json.error.message);

            const accounts = json.result?.value || [];
            if (!accounts.length) throw new Error("Empty accounts list");

            const result = accounts.slice(0, 50).map((acc, index) => ({
                rank: index + 1,
                wallet: acc.address,
                displayWallet: acc.address.slice(0, 4) + '...' + acc.address.slice(-4),
                balance: acc.uiAmount,
                balanceApprox: acc.uiAmount,
                tier: 'MEMBER'
            }));

            return res.status(200).json(result);
        } catch (e) {
            console.warn(`[Lifeboat] RPC Failed ${rpc}: ${e.message}`);
            lastError = e.message;
        }
    }

    // Fail safe
    res.status(502).json({ error: "All RPCs failed", details: lastError });
}
