
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import * as bagsService from './_src/services/bagsService.js';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function debug() {
    console.log("--- DEBUGGING BAGS HOLDERS ---");

    // 1. Connect DB (needed for init)
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db('dividends_game');
    console.log("DB Connected");

    // 2. Init Bags Service
    await bagsService.init(db);

    // 3. Force Refresh (in case cache is empty)
    // We can't export refreshSnapshot easily as it's internal, but init calls loadLatestSnapshot.
    // Let's try to get data immediately.

    console.log("Fetching Leaderboard...");
    const lb = await bagsService.getLeaderboard();

    console.log(`Top Holders Count: ${lb.topHolders?.length || 0}`);

    if (lb.topHolders?.length > 0) {
        console.log("Top 3:", lb.topHolders.slice(0, 3));
    } else {
        console.log("⚠️ No holders found. Snapshot might be empty.");
    }

    process.exit(0);
}

debug();
