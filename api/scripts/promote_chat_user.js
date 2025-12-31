import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../api/.env') });

const uri = process.env.MONGO_URI;
if (!uri) { console.error("No URI"); process.exit(1); }

async function run() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('dividends_game');

        // Get latest chat
        const lastMsg = await db.collection('chat').find({}).sort({ createdAt: -1 }).limit(1).toArray();

        if (lastMsg.length === 0) {
            console.log("No chat messages found.");
            process.exit(1);
        }

        const wallet = lastMsg[0].wallet;
        console.log(`Latest chat from Wallet: ${wallet}`);

        // Try wallet field first
        let result = await db.collection('users').updateOne(
            { wallet: wallet },
            { $set: { role: 'ADMIN' } }
        );

        if (result.matchedCount === 0) {
            console.log("No match using 'wallet' field. Trying 'handle' field...");
            result = await db.collection('users').updateOne(
                { handle: wallet },
                { $set: { role: 'ADMIN' } }
            );
        }

        if (result.matchedCount > 0) {
            console.log(`✅ SUCCESS: Promoted user with identifier ${wallet} to ADMIN.`);
        } else {
            console.log("❌ Failed to find user by wallet OR handle.");
        }

    } finally {
        await client.close();
    }
}
run();
