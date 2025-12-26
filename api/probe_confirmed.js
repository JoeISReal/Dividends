
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const API_KEY = process.env.BAGS_API_KEY;

const BASE = "https://public-api-v2.bags.fm";
const V1 = `${BASE}/api/v1`;

const ENDPOINTS = [
    `${BASE}/ping`,
    `${V1}/ping`,
    `${V1}/token-launch/tokens`,      // Guess
    `${V1}/token-launch/list`,        // Guess
    `${V1}/token-launch/recent`,      // Guess
    `${V1}/tokens`,                   // Retry standard
    `${V1}/pool/list`,                // Meteora related?
    // User mentioned "Program ID Bags Fee Share V2... Used by Token Launch v2"
    // Maybe there's an endpoint to get config?
];

async function run() {
    console.log(`Key Present: ${!!API_KEY}`);

    for (const url of ENDPOINTS) {
        try {
            console.log(`GET ${url}`);
            const res = await fetch(url, {
                headers: { 'x-api-key': API_KEY }
            });
            console.log(`   Status: ${res.status}`);

            if (res.ok) {
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    console.log(`   ✅ JSON: ${JSON.stringify(json).substring(0, 100)}`);
                } catch {
                    console.log(`   Text: ${text.substring(0, 50)}`);
                }
            } else if (res.status === 404) {
                // Check if it's the "HTML 404" or "JSON 404"
                const type = res.headers.get('content-type');
                if (type && type.includes('json')) {
                    console.log("   ❌ 404 (JSON Message)");
                } else {
                    console.log("   ❌ 404 (HTML/Route Missing)");
                }
            }
        } catch (e) {
            console.log(`   ERR: ${e.message}`);
        }
        console.log("");
    }
}

run();
