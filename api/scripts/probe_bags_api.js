
const MINT = "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";
const BASE = "https://api2.bags.fm/api/v1/token-launch";

const ROUTES = [
    `${BASE}/stats?tokenMint=${MINT}`,
    `${BASE}/info?tokenMint=${MINT}`,
    `${BASE}/details?tokenMint=${MINT}`,
    `${BASE}/metrics?tokenMint=${MINT}`,
    `https://api2.bags.fm/api/v1/token/${MINT}/info`,
    `https://api2.bags.fm/api/v1/token/${MINT}`
];

async function probe() {
    for (const url of ROUTES) {
        try {
            console.log(`Probing ${url}...`);
            const res = await fetch(url);
            if (res.ok) {
                const json = await res.json();
                console.log(`[SUCCESS] ${url}`, JSON.stringify(json).slice(0, 200));
            } else {
                console.log(`[FAIL] ${res.status}`);
            }
        } catch (e) {
            console.log(`[ERR] ${e.message}`);
        }
    }
}

probe();
