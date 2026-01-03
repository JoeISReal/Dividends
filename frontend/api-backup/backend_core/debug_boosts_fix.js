import dotenv from 'dotenv';
dotenv.config({ path: './.env' }); // Load from api/.env

const DEX_BOOSTS_API = "https://api.dexscreener.com/token-boosts/top/v1";

async function test() {
    console.log("--- Debug Boosts Fix ---");

    // 1. Fetch Boosts
    console.log("Fetching Boosts...");
    const res = await fetch(DEX_BOOSTS_API);
    const json = await res.json();

    const solTokens = json.filter(t => t.chainId === 'solana').slice(0, 1);
    if (solTokens.length === 0) {
        console.log("No solana tokens found");
        return;
    }

    const t = solTokens[0];
    console.log("First Token Object Keys:", Object.keys(t));
    console.log("Full Token Object:", JSON.stringify(t, null, 2));

    // 2. Check if Symbol exists
    console.log("Symbol check:", t.symbol ? t.symbol : "MISSING");

    // 3. Test Price Fetch for this mint (Jupiter V3)
    const mint = t.tokenAddress;
    const API_KEY = process.env.JUPITER_API_KEY;
    console.log(`Testing Price Fetch for: ${mint} (Key: ${!!API_KEY})`);

    if (API_KEY) {
        const url = `https://api.jup.ag/price/v3/get?ids=${mint}`;
        const pRes = await fetch(url, { headers: { 'x-api-key': API_KEY } });
        if (pRes.ok) {
            const pJson = await pRes.json();
            console.log("Jup Response:", JSON.stringify(pJson, null, 2));
            const data = pJson.data || pJson;
            const item = data[mint];
            console.log("Jup Info:", item ? `Price: ${item.price}, Symbol: ${item.mintSymbol}` : "Not found in Jup");
        } else {
            console.log("Jup Fetch Failed:", pRes.status);
            const txt = await pRes.text(); console.log(txt);
        }
    }
}

test();
