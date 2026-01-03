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
        // 1. UPDATE LOGIC (if handle is present)
        if (handle) {
            // Clean handle (remove @ just in case, though wallet addrs don't have it)
            const cleanHandle = handle.replace(/^@/, '');

            // Prepare update fields
            const updateFields = {
                lastActive: Date.now()
            };

            // Only update stats if they are better (or sync logic)
            // Actually, for sync we usually trust the client's latest for balances in this simple model
            // But let's respect the $max logic for safety, OR just $set if we trust client authoritative state

            // We do NOT update displayName here. That must come from /api/profile/update

            await collection.updateOne(
                { handle: cleanHandle },
                {
                    $set: updateFields,
                    $max: {
                        balance: balance || 0,
                        lifetimeYield: lifetimeYield || 0,
                        level: req.body.level || 1 // Sync Level
                    },
                    $setOnInsert: {
                        handle: cleanHandle,
                        createdAt: Date.now(),
                        // displayName will be undefined on insert, defaulting to handle in UI is fine
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
            .project({ _id: 0, handle: 1, displayName: 1, level: 1, lifetimeYield: 1 }) // Send Name and Level
            .toArray();

        res.status(200).json({ success: true, leaderboard: top50 });

    } catch (e) {
        console.error("DB Error:", e);
        res.status(500).json({ error: "Database error" });
    }
}
