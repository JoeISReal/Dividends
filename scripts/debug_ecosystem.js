async function run() {
    console.log("--- DEBUGGING ECOSYSTEM METRICS ---");

    // 1. Test Fees API (api2.bags.fm)
    console.log("\n1. Testing Fees API (api2.bags.fm)...");
    try {
        const url = "https://api2.bags.fm/api/v1/token-launch/lifetime-fees?tokenMint=7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";
        const start = Date.now();
        const res = await fetch(url);
        const duration = Date.now() - start;
        console.log(`Status: ${res.status} (${duration}ms)`);
        if (res.ok) {
            const json = await res.json();
            console.log("Response:", JSON.stringify(json, null, 2));
        } else {
            console.log("Text:", await res.text());
        }
    } catch (e) {
        console.error("Fees API Failed:", e.message);
    }

    // 2. Test Jupiter Price API
    console.log("\n2. Testing Jupiter Price API...");
    try {
        const url = "https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112";
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const json = await res.json();
            console.log("Price:", json.data['So11111111111111111111111111111111111111112'].price);
        }
    } catch (e) {
        console.error("Jupiter API Failed:", e.message);
    }

    // 3. Test RPC Holder Count (Alchemy)
    console.log("\n3. Testing RPC Holder Count (Alchemy)...");
    try {
        const rpc = "https://solana-mainnet.g.alchemy.com/v2/GOu50-6Y3sqi0q3AdLMFq";
        const payload = JSON.stringify({
            jsonrpc: "2.0", id: 1, method: "getProgramAccounts",
            params: [
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                {
                    encoding: "base64",
                    filters: [
                        { dataSize: 165 },
                        { memcmp: { offset: 0, bytes: "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS" } }
                    ],
                    dataSlice: { offset: 0, length: 0 }
                }
            ]
        });

        const start = Date.now();
        const res = await fetch(rpc, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
        console.log(`RPC Status: ${res.status} (${Date.now() - start}ms)`);

        if (res.ok) {
            const json = await res.json();
            if (json.result) {
                console.log(`Success! Holder Count: ${json.result.length}`);
            } else {
                console.log("RPC Error/Empty:", json);
            }
        } else {
            console.log("RPC Blocked:", await res.text());
        }

    } catch (e) {
        console.error("RPC Failed:", e.message);
    }
}

run();
