import { getDB } from './_db.js';

export default function handler(req, res) {
    const db = getDB();

    // Sort by Lifetime Yield desc
    const sorted = [...db.users].sort((a, b) => (b.lifetimeYield || 0) - (a.lifetimeYield || 0));

    // Top 50
    const top50 = sorted.slice(0, 50);

    res.status(200).json(top50);
}
