import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../api/.env') });

const uri = process.env.MONGO_URI;

if (!uri) {
    console.error("❌ MONGO_URI not found.");
    process.exit(1);
}

async function run() {
    const client = new MongoClient(uri);
    try {
        await client.connect();

        // Use explicit DB
        const db = client.db('dividends_game');
        console.log(`Connected to database: ${db.databaseName}`);

        const collections = await db.listCollections().toArray();
        console.log("Collections detected:", collections.map(c => c.name).join(', '));

        const users = db.collection('users');
        const count = await users.countDocuments();
        console.log(`User count: ${count}`);

        if (count > 0) {
            const latest = await users.find({}).sort({ _id: -1 }).limit(1).toArray();
            const u = latest[0];
            console.log(`LATEST_USER_FOUND: ${u.wallet} || Handle: ${u.handle} || Role: ${u.role}`);
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.close();
    }
}

run();
