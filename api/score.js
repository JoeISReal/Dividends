import { getDB, saveDB } from '../_db.js';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { handle, balance, lifetimeYield } = req.body;
    if (!handle) return res.status(400).json({ error: 'Handle required' });

    const db = getDB();
    const user = db.users.find(u => u.handle.toLowerCase() === handle.toLowerCase());

    if (user) {
        // Update high scores (only if higher)
        user.balance = Math.max(user.balance || 0, balance || 0);
        user.lifetimeYield = Math.max(user.lifetimeYield || 0, lifetimeYield || 0);
        user.lastActive = Date.now();
        saveDB(db);
        res.status(200).json({ success: true });
    } else {
        res.status(404).json({ error: 'User not found (Try logging in again)' });
    }
}
