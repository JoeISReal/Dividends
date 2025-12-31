
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const API_KEY = process.env.BAGS_API_KEY;

if (!API_KEY) {
    console.error("❌ BAGS_API_KEY not found in .env");
    console.log("Available Env Vars:", Object.keys(process.env).filter(k => k.includes('BAGS')));
    process.exit(1);
}

console.log(`✅ Found API Key: ${API_KEY.substring(0, 4)}...`);

const BASE_URL = "https://bags.fm/api/v1";
const PUBLIC_V2_URL = "https://public-api-v2.bags.fm/api/v1";

// Potential endpoints for trending/top tokens
const ENDPOINTS = [
    { url: `${PUBLIC_V2_URL}/tokens?sort=trending`, name: "V2 Tokens (sort=trending)" },
    { url: `${PUBLIC_V2_URL}/tokens?sort=volume`, name: "V2 Tokens (sort=volume)" },
    { url: `${PUBLIC_V2_URL}/trending`, name: "V2 Trending (Guess)" },
    { url: `${BASE_URL}/tokens?sort=trending`, name: "V1 Tokens (sort=trending)" },
    // Checking one specific token to see data structure vs list
    { url: `${PUBLIC_V2_URL}/tokens/7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS`, name: "Single Token Check" }
];

async function testEndpoints() {
    console.log("🔍 Testing Bags API Endpoints for Trending Data...\n");

    for (const ep of ENDPOINTS) {
        try {
            console.log(`Testing: ${ep.name} ...`);
            const res = await fetch(ep.url, {
                headers: {
                    'x-api-key': API_KEY, // Try common header
                    'Authorization': `Bearer ${API_KEY}` // And bearer just in case, though doc usually says one
                }
            });

            console.log(`   Status: ${res.status} ${res.statusText}`);

            if (res.ok) {
                const data = await res.json();
                const preview = JSON.stringify(data).substring(0, 200);
                console.log(`   ✅ Data Preview: ${preview}...`);

                // If it's a list, show length
                if (Array.isArray(data)) {
                    console.log(`   Items: ${data.length}`);
                } else if (data.tokens && Array.isArray(data.tokens)) {
                    console.log(`   Items (in .tokens): ${data.tokens.length}`);
                }
            } else {
                // Try to read error body
                try {
                    const errText = await res.text();
                    console.log(`   ❌ Error Body: ${errText.substring(0, 100)}`);
                } catch (e) { }
            }
        } catch (err) {
            console.log(`   ❌ Fetch Error: ${err.message}`);
        }
        console.log("-".repeat(40));
    }
}

testEndpoints();
