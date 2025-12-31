import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../api/.env') });

const uri = process.env.MONGO_URI;
if (!uri) { console.error("No URI"); process.exit(1); }

const targetHandle = process.argv[2];
if (!targetHandle) { console.error("Provide handle"); process.exit(1); }

async function run() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('dividends_game');
        const users = db.collection('users');

        const user = await users.findOne({ handle: targetHandle });

        if (user) {
            console.log(`FOUND: ${user.handle} | Wallet: ${user.wallet} | Role: ${user.role} | ID: ${user._id}`);
        } else {
            console.log(`NOT FOUND: ${targetHandle}`);
            // List top 5 to see what's there
            const all = await users.find({}).limit(5).toArray();
            console.log("Here are 5 users:");
            all.forEach(u => console.log(`- ${u.handle}`));
        }
    } finally {
        await client.close();
    }
}
run();
