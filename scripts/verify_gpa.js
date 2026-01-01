async function run() {
    const rpc = "https://solana-mainnet.g.alchemy.com/v2/GOu50-6Y3sqi0q3AdLMFq";
    const MINT = "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";
    const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

    console.log("Testing getProgramAccounts (GPA)...");
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
                ]
            }
        ]
    });

    try {
        const start = Date.now();
        const res = await fetch(rpc, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
        console.log(`Status: ${res.status}`);

        if (!res.ok) {
            console.error(await res.text());
            return;
        }

        const json = await res.json();
        const duration = Date.now() - start;
        console.log(`Fetch Duration: ${duration}ms`);

        if (json.error) {
            console.error("RPC Error:", json.error);
        } else if (json.result) {
            console.log(`Success! Retrieved ${json.result.length} accounts.`);
            console.log(`First Account Data Len: ${json.result[0].account.data[0].length}`);
        } else {
            console.log("Unknown response:", json);
        }

    } catch (e) {
        console.error("Fetch Exception:", e);
    }
}

run();
