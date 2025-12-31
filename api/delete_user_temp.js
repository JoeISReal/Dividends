import dotenv from 'dotenv';
dotenv.config({ path: 'api/.env' });
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
        const db = client.db('dividends_game'); // Explicit DB
        console.log(`Connected to DB: ${db.databaseName}`);

        const users = db.collection('users');
        const count = await users.countDocuments();
        console.log(`User count: ${count}`);

        const handle = "9uni1rBM2qk3dyu5d7npW66zS5LAVsPRhTTZkjDPjnjB";

        console.log(`Deleting user: ${handle}...`);
        const resUser = await users.deleteOne({ handle });
        console.log(`Deleted User Count: ${resUser.deletedCount}`);

        const challenges = db.collection('challenges');
        const resCh = await challenges.deleteMany({ wallet: handle });
        console.log(`Deleted Challenges Count: ${resCh.deletedCount}`);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

run();
