import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../api/.env') });

const uri = process.env.MONGO_URI;
if (!uri) { console.error("No MONGO_URI"); process.exit(1); }

async function run() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('dividends_game');

        // Find latest chat messages
        const chats = await db.collection('chat').find({}).sort({ createdAt: -1 }).limit(5).toArray();

        console.log("Latest Chat Messages:");
        chats.forEach(c => {
            console.log(`[${c.text}] sent by Wallet: ${c.wallet} | Handle: ${c.handle} | Display: ${c.displayName}`);
        });

    } finally {
        await client.close();
    }
}
run();
