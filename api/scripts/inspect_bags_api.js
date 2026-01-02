
const MINT = "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";

async function checkExternalApis() {
    // 1. DexScreener
    const dxUrl = `https://api.dexscreener.com/latest/dex/tokens/${MINT}`;
    try {
        console.log(`Checking DexScreener...`);
        const res = await fetch(dxUrl);
        const json = await res.json();
        const pair = json.pairs?.[0];
        console.log("DexScreener Data Keys:", pair ? Object.keys(pair) : "No Pair");
        // Check deep keys
        if (pair) {
            console.log("Labels:", pair.labels);
        }
    } catch (e) {
        console.error("Dex Error:", e.message);
    }

    // 2. Jupiter (Token)
    // Note: Standard Jup token list API
    const jupUrl = `https://token.jup.ag/all`;
    // This is huge, let's try a specific query if possible or just fetch all and find (heavy but effective for test)
    // Actually, asking for specific token metadata if Jup has an endpoint.
    // Try https://api.jup.ag/price/v2?ids=... (Price only)
    // Try https://station.jup.ag/api/v1/token/... (Maybe?)

    console.log("Checking Solscan Public API (Unofficial/RateLimited?)...");
    // https://public-api.solscan.io/token/meta?tokenAddress=...
    try {
        const ssUrl = `https://public-api.solscan.io/token/meta?tokenAddress=${MINT}`;
        const res = await fetch(ssUrl);
        if (res.ok) {
            const json = await res.json();
            console.log("Solscan Holder Count:", json.holder);
        } else {
            console.log("Solscan failed:", res.status);
        }
    } catch (e) { console.log("Solscan Error", e.message); }
}

checkExternalApis();
