export default async function handler(req, res) {
    // 1. Set Cache Headers (Cache for 5 mins, stale for 10 mins)
    // This prevents hitting Alchemy Rate Limits by serving shared cache
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    try {
        const RPC_LIST = [
            "https://solana-mainnet.g.alchemy.com/v2/GOu50-6Y3sqi0q3AdLMFq",
            "https://solana-mainnet.rpc.extrnode.com"
        ];

        const MINT = "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";
        const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

        // Count Scan Payload
        const payload = JSON.stringify({
            jsonrpc: "2.0", id: 1,
            method: "getProgramAccounts",
            params: [
                TOKEN_PROGRAM_ID,
                {
                    encoding: "base64",
                    filters: [
                        { dataSize: 165 },
                        { memcmp: { offset: 0, bytes: MINT } }
                    ],
                    dataSlice: { offset: 0, length: 0 } // Fetch nothing, just count
                }
            ]
        });

        for (const rpc of RPC_LIST) {
            try {
                const response = await fetch(rpc, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload
                });

                if (!response.ok) continue;
                const json = await response.json();

                if (json.result) {
                    const count = json.result.length;
                    return res.status(200).json({
                        count: count,
                        formatted: new Intl.NumberFormat('en-US').format(count)
                    });
                }
            } catch (e) {
                console.warn(`RPC ${rpc} failed:`, e);
            }
        }

        throw new Error("All RPCs failed");

    } catch (e) {
        return res.status(500).json({ error: e.message, fallback: "..." });
    }
}
