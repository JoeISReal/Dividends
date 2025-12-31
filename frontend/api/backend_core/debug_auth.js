import dotenv from 'dotenv';
dotenv.config({ path: './api/.env' });

const API_KEY = process.env.JUPITER_API_KEY;

// Potential Endpoints to test
const URLS = [
    "https://api.jup.ag/tokens/v2/category/toptrending", // Path style
    "https://api.jup.ag/tokens/v2/all", // Baseline V2
    "https://api.jup.ag/stats/v2/tokens/trending" // Guess
];

async function testAuth() {
    console.log(`Testing Key: ${API_KEY ? "Present" : "MISSING"}`);
    if (!API_KEY) return;

    for (const url of URLS) {
        console.log(`\n--- Testing ${url} ---`);
        try {
            const res = await fetch(url, { headers: { 'x-api-key': API_KEY } });
            console.log(`Status: ${res.status}`);
            if (res.status !== 200) {
                // Shorten text to avoid spam
                const txt = await res.text();
                console.log(txt.substring(0, 100));
            } else {
                console.log("SUCCESS!");
            }
        } catch (e) {
            console.log("Error: " + e.message);
        }
    }
}

testAuth();
