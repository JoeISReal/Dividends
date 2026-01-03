
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const API_KEY = process.env.BAGS_API_KEY;
const OUT_FILE = path.join(__dirname, 'test_results.json');

const ENDPOINTS = [
    "https://public-api-v2.bags.fm/api/v1/tokens?sort=trending",
    "https://public-api-v2.bags.fm/api/v1/tokens?sort=volume",
    "https://public-api-v2.bags.fm/api/v1/tokens",
    "https://bags.fm/api/v1/tokens?sort=trending"
];

async function run() {
    const results = {};

    if (!API_KEY) {
        results.error = "No API Key";
        fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
        return;
    }

    for (const url of ENDPOINTS) {
        try {
            console.log(`Fetching ${url}...`);
            const res = await fetch(url, {
                headers: { 'x-api-key': API_KEY }
            });

            let data;
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await res.json();
                // Truncate if list
                if (Array.isArray(data)) data = { description: `Array of ${data.length}`, sample: data.slice(0, 2) };
            } else {
                data = `Non-JSON: ${(await res.text()).substring(0, 100)}`;
            }

            results[url] = {
                status: res.status,
                data: data
            };
        } catch (e) {
            results[url] = { error: e.message };
        }
    }

    fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
    console.log("Done.");
}

run();
