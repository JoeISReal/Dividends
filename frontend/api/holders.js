const RPC_LIST = [
    "https://solana-mainnet.rpc.extrnode.com",
    "https://rpc.ankr.com/solana",
    "https://api.mainnet-beta.solana.com"
];

export default async function handler(req, res) {
    // CORS
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

    // JSON-RPC Payload
    const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenLargestAccounts",
        params: [
            MINT,
            { commitment: "confirmed" }
        ]
    };

    let lastError = null;

    for (const rpc of RPC_LIST) {
        try {
            console.log(`Lifeboat trying: ${rpc}`);

            // Short timeout to fail fast and try next
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const response = await fetch(rpc, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const json = await response.json();
            if (json.error) throw new Error(json.error.message);

            const accounts = json.result?.value || [];
            if (!accounts.length) throw new Error("Empty accounts list");

            const result = accounts.slice(0, 50).map((acc, index) => ({
                rank: index + 1,
                wallet: acc.address, // Correct field for getTokenLargestAccounts
                displayWallet: acc.address.slice(0, 4) + '...' + acc.address.slice(-4),
                balance: acc.uiAmount,
                balanceApprox: acc.uiAmount,
                tier: 'MEMBER'
            }));

            // Success!
            return res.status(200).json(result);

        } catch (e) {
            console.warn(`RPC Failed (${rpc}):`, e.message);
            lastError = e.message;
        }
    }

    // All failed
    res.status(502).json({
        error: "All RPCs failed",
        detail: lastError,
        mock: true
    });
}
