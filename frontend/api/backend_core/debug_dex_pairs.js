const BOOSTS = "https://api.dexscreener.com/token-boosts/top/v1";

async function test() {
    console.log("Fetching Boosts...");
    const bRes = await fetch(BOOSTS);
    const bJson = await bRes.json();

    // Take top 5 solana mints
    const mints = bJson
        .filter(t => t.chainId === 'solana')
        .slice(0, 5)
        .map(t => t.tokenAddress);

    console.log("Mints:", mints);

    // Fetch Pairs from DexScreener
    const url = `https://api.dexscreener.com/latest/dex/tokens/${mints.join(',')}`;
    console.log("Fetching Pairs:", url);
    const pRes = await fetch(url);
    const pJson = await pRes.json();

    const pairs = pJson.pairs || [];

    console.log(`Found ${pairs.length} pairs.`);
    if (pairs.length > 0) {
        console.log("First Pair Base Token:", pairs[0].baseToken);
        console.log("First Pair Price:", pairs[0].priceUsd);
    }
}

test();
