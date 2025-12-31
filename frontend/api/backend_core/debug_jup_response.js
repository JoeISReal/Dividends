import dotenv from 'dotenv';
dotenv.config({ path: 'api/.env' });

console.log("Key:", process.env.JUPITER_API_KEY ? "Loaded" : "Missing");

import { fetchTrendingTokens } from './_src/services/jupiterService.js';

async function test() {
    try {
        console.log("Testing fetchTrendingTokens (Jupiter V2)...");
        const res = await fetchTrendingTokens();

        if (res.error) {
            console.error("Error:", res.message);
        } else {
            console.log("Success! Source:", res.source);
            console.log("Tokens Found:", res.tokens?.length);
            if (res.tokens?.length > 0) {
                console.log("Sample Token:", JSON.stringify(res.tokens[0], null, 2));
            }
        }
    } catch (e) {
        console.error("Test execution failed:", e);
    }
}

test();
