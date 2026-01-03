
const MINT = "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";

async function check() {
    console.log(`Checking Data for Mint: ${MINT}\n`);

    // 1. Check Bags API (Holder Data)
    try {
        console.log("--- Checking Bags API (Holders) ---");
        const bagsRes = await fetch(`https://public-api-v2.bags.fm/api/v1/tokens/${MINT}`);
        console.log(`Bags Status: ${bagsRes.status} ${bagsRes.statusText}`);
        if (bagsRes.ok) {
            const data = await bagsRes.json();
            console.log("Bags Data Found:", JSON.stringify(data).substring(0, 100) + "...");
        } else {
            // Try fetching holders directly as fallback check
            const holdersRes = await fetch(`https://public-api-v2.bags.fm/api/v1/tokens/${MINT}/holders`);
            console.log(`Bags Holders Status: ${holdersRes.status}`);
        }
    } catch (e) {
        console.log("Bags Error:", e.message);
    }

    console.log("\n");

    // 2. Check DexScreener API (Market Data)
    try {
        console.log("--- Checking DexScreener API (Market) ---");
        const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${MINT}`);
        if (dexRes.ok) {
            const data = await dexRes.json();
            if (data.pairs && data.pairs.length > 0) {
                const pair = data.pairs[0];
                console.log("✅ DexScreener Data Found!");
                console.log(`Price: $${pair.priceUsd}`);
                console.log(`Volume 24h: $${pair.volume.h24}`);
                console.log(`Liquidity: $${pair.liquidity.usd}`);
                console.log(`Dex: ${pair.dexId}`);
            } else {
                console.log("❌ DexScreener: No pairs found for this token.");
            }
        } else {
            console.log(`DexScreener Status: ${dexRes.status}`);
        }
    } catch (e) {
        console.log("DexScreener Error:", e.message);
    }
}

check();
