import { getDB } from './_db.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { handle, balance, lifetimeYield } = req.body;

    try {
        const db = await getDB();
        const collection = db.collection('users');

        // 1. UPDATE LOGIC (if handle is present)
        if (handle) {
            // Clean handle (remove @ just in case, though wallet addrs don't have it)
            const cleanHandle = handle.replace(/^@/, '');

            // Upsert: Update if exists, Insert if new
            await collection.updateOne(
                { handle: cleanHandle },
                {
                    $set: {
                        lastActive: Date.now()
                    },
                    $max: {
                        balance: balance || 0,
                        lifetimeYield: lifetimeYield || 0
                    },
                    $setOnInsert: {
                        handle: cleanHandle,
                        createdAt: Date.now()
                    }
                },
                { upsert: true }
            );
        }

        // 2. READ LEADERBOARD LOGIC
        // Fetch Top 50 by Lifetime Yield
        const top50 = await collection
            .find({})
            .sort({ lifetimeYield: -1 })
            .limit(50)
            .project({ _id: 0, handle: 1, lifetimeYield: 1 }) // Only send necessary data
            .toArray();

        res.status(200).json({ success: true, leaderboard: top50 });

    } catch (e) {
        console.error("DB Error:", e);
        res.status(500).json({ error: "Database error" });
    }
}
