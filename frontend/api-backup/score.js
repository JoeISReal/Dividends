import { getDB, saveDB } from '../_db.js';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { handle, balance, lifetimeYield } = req.body;
    if (!handle) return res.status(400).json({ error: 'Handle required' });

    const db = getDB();
    let user = db.users.find(u => u.handle.toLowerCase() === handle.toLowerCase());

    if (!user) {
        // UPSERT: If user missing (e.g. serverless cold start), create them now.
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

    res.status(200).json({ success: true });
}
