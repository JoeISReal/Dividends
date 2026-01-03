
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const API_KEY = process.env.BAGS_API_KEY;
const LOG_FILE = path.join(__dirname, 'bags_probe.log');

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

fs.writeFileSync(LOG_FILE, `Probe started at ${new Date().toISOString()}\n`);

if (!API_KEY) {
    log("❌ BAGS_API_KEY not found.");
    process.exit(1);
}

const ENDPOINTS = [
    "https://bags.fm/api/v1/tokens",
    "https://bags.fm/api/v1/tokens?sort=trending",
    "https://public-api-v2.bags.fm/api/v1/tokens",
    "https://public-api-v2.bags.fm/api/v1/tokens?sort=trending",
    "https://public-api-v2.bags.fm/api/v1/trending"
];

async function probe() {
    for (const url of ENDPOINTS) {
        log(`\nTesting: ${url}`);
        try {
            const res = await fetch(url, {
                headers: { 'x-api-key': API_KEY }
            });
            log(`Status: ${res.status}`);
            const text = await res.text();
            if (text.trim().startsWith('<')) {
                log(`Response: HTML/Error (${text.substring(0, 50)}...)`);
            } else {
                log(`Response: ${text.substring(0, 300)}...`);
            }
        } catch (e) {
            log(`Error: ${e.message}`);
        }
    }
}

probe();
