import { getDB, saveDB } from './_db.js';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { handle, balance, lifetimeYield } = req.body;

    // DB Access
    const db = getDB();

    // 1. UPDATE / LOGIN LOGIC
    if (handle) {
        let user = db.users.find(u => u.handle.toLowerCase() === handle.toLowerCase());

        if (!user) {
            // Upsert / Auto-register
            user = {
                handle,
                balance: 0,
                lifetimeYield: 0,
                lastActive: Date.now()
            };
            db.users.push(user);
        }

        // Update stats
        user.balance = Math.max(user.balance || 0, balance || 0);
        user.lifetimeYield = Math.max(user.lifetimeYield || 0, lifetimeYield || 0);
        user.lastActive = Date.now();

        saveDB(db);
    }

    // 2. READ LEADERBOARD LOGIC
    // Sort by Lifetime Yield desc
    const sorted = [...db.users].sort((a, b) => (b.lifetimeYield || 0) - (a.lifetimeYield || 0));
    const top50 = sorted.slice(0, 50);

    // Return both success status and the data
    res.status(200).json({ success: true, leaderboard: top50 });
}
