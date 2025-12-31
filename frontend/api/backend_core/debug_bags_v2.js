
// Diagnostic V2: Deep Check for Bags Token
// Based on updateAuthority: BAGSB9...

const MINT = "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";
// No need to require node-fetch in modern Node


async function check() {
    console.log(`Deep Checking Mint: ${MINT}\n`);

    const ENDPOINTS = [
        `https://bags.fm/api/v1/tokens/${MINT}`,
        `https://public-api-v2.bags.fm/api/v1/tokens/${MINT}`,
        // Launchpad specific
        `https://bags.fm/api/v1/token-launch/token/${MINT}`,
        `https://public-api-v2.bags.fm/api/v1/token-launch/token/${MINT}`,
        // Holders specific
        `https://public-api-v2.bags.fm/api/v1/tokens/${MINT}/holders`,
        `https://bags.fm/api/v1/tokens/${MINT}/holders`
    ];

    for (const url of ENDPOINTS) {
        try {
            const res = await fetch(url);
            console.log(`[${res.status}] ${url}`);
            if (res.ok) {
                const data = await res.json();
                console.log(">>> SUCCESS DATA:", JSON.stringify(data).substring(0, 100));
            }
        } catch (e) {
            console.log(`[ERR] ${url}: ${e.message}`);
        }
    }
}

check();
