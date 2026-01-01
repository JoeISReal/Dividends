export default async function handler(req, res) {
    // 1. Set Cache Headers (Cache for 60s, stale for 60s)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=60');

    try {
        const MINT = "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";
        const SOL_MINT = "So11111111111111111111111111111111111111112";

        // 2. Fetch Fees (Bags API)
        const feesRes = await fetch(`https://api2.bags.fm/api/v1/token-launch/lifetime-fees?tokenMint=${MINT}`);
        if (!feesRes.ok) throw new Error("Bags API Failed");
        const feesData = await feesRes.json();

        let solAmount = 0;
        if (feesData.success && feesData.response) {
            solAmount = Number(feesData.response) / 1000000000;
        }

        // 3. Fetch Price (Jupiter)
        let price = 180; // Default
        try {
            const priceRes = await fetch(`https://api.jup.ag/price/v2?ids=${SOL_MINT}`);
            const priceJson = await priceRes.json();
            if (priceJson.data && priceJson.data[SOL_MINT]) {
                price = Number(priceJson.data[SOL_MINT].price);
            }
        } catch (e) {
            console.warn("Price fetch failed, using default");
        }

        // 4. Calculate
        const totalUsd = solAmount * price;

        return res.status(200).json({
            sol: solAmount,
            price: price,
            totalUsd: totalUsd,
            formatted: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalUsd)
        });

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
