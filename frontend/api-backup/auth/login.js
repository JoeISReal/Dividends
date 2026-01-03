import { getDB, saveDB } from '../_db.js';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { handle } = req.body;
    if (!handle) return res.status(400).json({ error: 'Handle required' });

    const db = getDB();
    let user = db.users.find(u => u.handle.toLowerCase() === handle.toLowerCase());

    if (!user) {
        // Register new user
        user = {
            handle,
            balance: 0,
            lifetimeYield: 0,
            level: 1,
            lastActive: Date.now()
        };
        db.users.push(user);
        saveDB(db);
    }

    // Return the full user object (including displayName if set)
    res.status(200).json({ success: true, user });
}
