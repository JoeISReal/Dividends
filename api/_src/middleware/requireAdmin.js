import { verifySession } from '../services/authCookies.js';

export function requireAdmin(req, res, next) {
    const token = req.cookies?.sid;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const session = verifySession(token, process.env.COOKIE_SECRET);
    if (!session || !session.wallet) return res.status(401).json({ error: "Invalid session" });

    // Attach session to request
    req.session = session;

    // Check if user has ADMIN role
    const db = req.app.locals.db;
    if (!db) return res.status(503).json({ error: "Database not connected" });

    db.collection('users').findOne({ handle: session.wallet })
        .then(user => {
            if (!user || user.role !== 'ADMIN') {
                return res.status(403).json({ error: "Admin access required" });
            }
            next();
        })
        .catch(err => {
            console.error("Admin Auth Error:", err);
            res.status(500).json({ error: "Auth check failed" });
        });
}
