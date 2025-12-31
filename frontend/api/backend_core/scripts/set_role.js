import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Try to load .env from api/ directory (assuming run from root or api/scripts)
dotenv.config({ path: path.join(__dirname, '../../api/.env') });

const uri = process.env.MONGO_URI;

if (!uri) {
    console.error("❌ MONGO_URI not found. Make sure you have api/.env set up.");
    process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log("Usage: node api/scripts/set_role.js <wallet|handle> <role>");
    process.exit(1);
}

const identifier = args[0];
const role = args[1].toUpperCase();

const VALID_ROLES = ['USER', 'MOD', 'ADMIN'];
if (!VALID_ROLES.includes(role)) {
    console.error(`❌ Invalid Role. Must be one of: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
}

async function run() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('dividends_game');

        const users = db.collection('users');

        // Try to find by wallet or handle
        const query = {
            $or: [
                { wallet: identifier },
                { handle: identifier }
            ]
        };

        const user = await users.findOne(query);

        if (!user) {
            console.error(`❌ User not found: ${identifier}`);
            process.exit(1);
        }

        const result = await users.updateOne(
            { _id: user._id },
            { $set: { role: role } }
        );

        if (result.modifiedCount > 0) {
            console.log(`✅ SUCCESS: Updated ${user.handle} (${user.wallet}) to role ${role}`);
        } else {
            console.log(`⚠️  No changes made. User might already be ${role}.`);
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await client.close();
    }
}

run();
