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
        const db = client.db('dividends_game'); // Explicit DB

        const users = db.collection('users');
        const latest = await users.find({}).sort({ _id: -1 }).limit(1).toArray();

        if (latest.length === 0) {
            console.log("No users found to promote.");
            process.exit(1);
        }

        const user = latest[0];
        console.log(`Promoting User: ${user.wallet} (${user.handle})`);

        const result = await users.updateOne(
            { _id: user._id },
            { $set: { role: 'ADMIN' } }
        );

        if (result.modifiedCount > 0) {
            console.log(`✅ SUCCESS: ${user.handle} is now an ADMIN.`);
        } else {
            console.log(`User is already ${user.role}.`);
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.close();
    }
}

run();
