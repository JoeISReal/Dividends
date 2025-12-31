
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const MINT = "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";
const BASE = "https://api2.bags.fm/api/v1";

const ENDPOINTS = [
    `/token-launch/info?tokenMint=${MINT}`,
    `/token-launch/stats?tokenMint=${MINT}`,
    `/token-launch/status?tokenMint=${MINT}`,
    `/token-launch/distributions?tokenMint=${MINT}`,
    `/token-launch/activity?tokenMint=${MINT}`,
    `/token/stats?tokenMint=${MINT}`,
    `/token/info?tokenMint=${MINT}`
];

async function probe() {
    console.log(`Probing API2 for Mint: ${MINT}`);

    for (const ep of ENDPOINTS) {
        const url = `${BASE}${ep}`;
        try {
            const res = await fetch(url);
            console.log(`\nChecking: ${ep}`);
            console.log(`Status: ${res.status}`);

            if (res.ok) {
                const data = await res.json();
                console.log("SUCCESS! Keys:", Object.keys(data));
                // console.log(JSON.stringify(data, null, 2).slice(0, 500)); // Peek
                if (data.success && data.response) {
                    console.log("PAYLOAD:", JSON.stringify(data.response, null, 2).slice(0, 500));
                }
            } else {
                // console.log("Failed.");
            }
        } catch (e) {
            console.log("Error:", e.message);
        }
    }
}

probe();
