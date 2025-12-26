
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const API_KEY = process.env.BAGS_API_KEY;

const URLS = [
    "https://public-api-v2.bags.fm/api/v1/tokens/trending",
    "https://public-api-v2.bags.fm/api/v1/analytics/trending",
    "https://public-api-v2.bags.fm/api/v1/market/trending",
    "https://bags.fm/api/v1/tokens/trending",
    // Auth Check
    "https://public-api-v2.bags.fm/api/v1/me",
    "https://public-api-v2.bags.fm/api/v1/user"
];

async function run() {
    console.log(`Key: ${API_KEY ? 'Present' : 'Missing'}`);
    for (const url of URLS) {
        try {
            console.log(`GET ${url}...`);
            const res = await fetch(url, {
                headers: { 'x-api-key': API_KEY }
            });
            console.log(`Status: ${res.status}`);
            if (res.ok) {
                const text = await res.text();
                console.log(`Data: ${text.substring(0, 150)}`);
            }
        } catch (e) {
            console.log(`Err: ${e.message}`);
        }
    }
}

run();
