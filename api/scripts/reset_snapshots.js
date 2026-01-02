import dotenv from 'dotenv';
dotenv.config({ path: './api/.env' }); // Adjust path if needed relative to root
import { MongoClient } from 'mongodb';

async function resetSnapshots() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error("No MONGO_URI found");
        process.exit(1);
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('dividends_game');

        // Delete all snapshots to force full refresh
        const result = await db.collection('bags_snapshots').deleteMany({});
        console.log(`Deleted ${result.deletedCount} snapshots. Backend will now force a refresh on restart.`);

    } catch (e) {
        console.error("Reset Error:", e);
    } finally {
        await client.close();
    }
}

resetSnapshots();
