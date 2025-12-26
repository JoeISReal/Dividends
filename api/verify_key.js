
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const API_KEY = process.env.BAGS_API_KEY;

// Domains to check
const DOMAINS = [
    "https://bags.fm",
    "https://public-api-v2.bags.fm",
    "https://api.bags.fm"
];

async function check() {
    console.log(`Testing Key: ${API_KEY ? 'Loaded' : 'Missing'}`);

    for (const domain of DOMAINS) {
        console.log(`\n--- Probing ${domain} ---`);
        try {
            // 1. Root Check
            const rootRes = await fetch(domain);
            console.log(`GET / status: ${rootRes.status}`);

            // 2. Auth Check (Random Endpoint to provoke 401?)
            const authUrl = `${domain}/api/v1/tokens`;
            console.log(`GET ${authUrl} (with key)`);
            const authRes = await fetch(authUrl, {
                headers: {
                    'x-api-key': API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`Status: ${authRes.status}`);

            if (authRes.status === 401 || authRes.status === 403) {
                console.log("RESULT: Endpoint exists, Key invalid/unauthorized (401/403).");
            } else if (authRes.status === 404) {
                // Check if it's JSON 404 (Endpoint missing) or HTML (Route missing)
                const type = authRes.headers.get('content-type');
                if (type && type.includes('json')) {
                    console.log("RESULT: Endpoint not found (JSON 404). Service likely active.");
                } else {
                    console.log("RESULT: 404 HTML. Likely wrong base URL path.");
                }
            } else if (authRes.ok) {
                console.log("RESULT: SUCCESS! Key is Valid.");
            }

        } catch (e) {
            console.log(`Connection Failed: ${e.message}`);
        }
    }
}

check();
