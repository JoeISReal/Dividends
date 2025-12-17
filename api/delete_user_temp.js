// Loaded via --env-file=.env
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;

if (!uri) {
    console.error("No MONGO_URI found in env");
    process.exit(1);
}

const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db(); // Use default from URI
        console.log(`Connected to DB: ${db.databaseName}`);

        const users = db.collection('users');
        const count = await users.countDocuments();
        console.log(`User count: ${count}`);

        console.log("Listing users (Limit 20)...");
        const allUsers = await users.find({}).limit(20).toArray();

        allUsers.forEach(u => {
            console.log(`- [${u.displayName || 'No Name'}] ${u.handle} (Bal: ${Math.round(u.balance)})`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

run();
