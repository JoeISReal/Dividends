import { verifySession } from "../services/authCookies.js";

export function requireAuth(req, res, next) {
    const secret = process.env.COOKIE_SECRET;
    if (!secret) return res.status(500).json({ error: "COOKIE_SECRET not set" });

    const token = req.cookies?.sid;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const session = verifySession(token, secret);
    if (!session || !session.wallet) return res.status(401).json({ error: "Invalid session" });

    req.session = session; // { wallet, iat, exp }
    next();
}
