
import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { MongoClient, ObjectId } from 'mongodb'; // Import ObjectId for valid mongo queries

const router = express.Router();

let db;
// Middleware to ensure DB is available from the main app
router.use((req, res, next) => {
    if (!req.app.locals.db) {
        return res.status(503).json({ error: "Database not connected" });
    }
    db = req.app.locals.db;
    next();
});

// SSE Clients
let clients = [];

// Helper: Broadcast to all connected clients
const broadcast = (data) => {
    clients.forEach(client => client.res.write(`data: ${JSON.stringify(data)}\n\n`));
};

/* =========================================================================
   CHAT OPS
   ========================================================================= */

// GET /api/community/chat/stream -> SSE Endpoint
router.get('/chat/stream', requireAuth, (req, res) => {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);

    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res,
        wallet: req.session.wallet
    };

    clients.push(newClient);

    // Initial Ping
    res.write(`data: ${JSON.stringify({ type: 'ping', time: Date.now() })}\n\n`);

    // Keepalive loop
    const keepAlive = setInterval(() => {
        res.write(`data: ${JSON.stringify({ type: 'ping', time: Date.now() })}\n\n`);
    }, 15000);

    req.on('close', () => {
        clearInterval(keepAlive);
        clients = clients.filter(c => c.id !== clientId);
    });
});

// GET /api/community/chat/recent -> Fetch recent messages
router.get('/chat/recent', requireAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 30;
        // Fetch recent messages, excluding shadowed ones unless user is MOD/ADMIN
        const user = await db.collection('users').findOne({ handle: req.session.wallet });
        const isStaff = user?.role === 'MOD' || user?.role === 'ADMIN';

        const query = isStaff ? {} : { status: { $ne: 'SHADOWED' } };

        const messages = await db.collection('chat')
            .find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray();

        res.json(messages.reverse());
    } catch (e) {
        console.error("Chat Recent Error:", e);
        res.status(500).json({ error: "Fetch failed" });
    }
});

// POST /api/community/chat/send -> Send Message
router.post('/chat/send', requireAuth, async (req, res) => {
    const { text } = req.body;
    const wallet = req.session.wallet;

    if (!text || text.length > 240) return res.status(400).json({ error: "Invalid length" });

    // 1. Fetch User & Validate
    const user = await db.collection('users').findOne({ handle: wallet });
    if (!user) return res.status(401).json({ error: "User not found" });

    // Check Mute
    if (user.mutedUntil && new Date(user.mutedUntil) > new Date()) {
        return res.status(403).json({ error: `Muted until ${new Date(user.mutedUntil).toLocaleTimeString()}` });
    }

    // Rate Limit (Basic: 1 msg / 5s)
    const lastMsg = await db.collection('chat').findOne({ wallet }, { sort: { createdAt: -1 } });
    if (lastMsg && (Date.now() - new Date(lastMsg.createdAt).getTime()) < 5000) {
        return res.status(429).json({ error: "Rate limit (5s)" });
    }

    // Link Block
    if (text.includes('http') || text.includes('www.')) {
        return res.status(400).json({ error: "Links disabled" });
    }

    // 2. Create Message
    const msg = {
        wallet,
        displayName: user.displayName || wallet.slice(0, 6),
        tier: user.holderTier || 'OBSERVER',
        role: user.role || 'USER', // USER, MOD, ADMIN
        text: text.trim(), // Sanitize input
        createdAt: new Date(),
        status: 'LIVE',
        shadowed: false
    };

    const result = await db.collection('chat').insertOne(msg);
    const savedMsg = { ...msg, _id: result.insertedId };

    // 3. Broadcast
    broadcast({ type: 'message', data: savedMsg });

    res.json({ success: true, message: savedMsg });
});


/* =========================================================================
   MODERATION
   ========================================================================= */

// POST /api/community/chat/mod/action
router.post('/chat/mod/action', requireAuth, async (req, res) => {
    const { action, targetId, reason, duration } = req.body; // targetId is messageId or wallet
    const modWallet = req.session.wallet;

    // 1. Verify Mod Auth
    const modUser = await db.collection('users').findOne({ handle: modWallet });
    if (!modUser || (modUser.role !== 'MOD' && modUser.role !== 'ADMIN')) {
        return res.status(403).json({ error: "Access denied" });
    }

    try {
        if (action === 'remove' || action === 'shadow') {
            const update = action === 'remove' ? { status: 'REMOVED' } : { status: 'SHADOWED', shadowed: true };
            // Handle valid ObjectID
            let query = {};
            try {
                query = { _id: new ObjectId(targetId) };
            } catch {
                query = { _id: targetId }; // Fallback for string IDs if relevant
            }

            await db.collection('chat').updateOne(query, { $set: update });

            // Broadcast deletion/shadow update to clients (to remove from view)
            broadcast({ type: 'mod_action', action, targetId });
        }
        else if (action === 'mute') {
            const muteDuration = duration || 5 * 60 * 1000; // Default 5m
            const mutedUntil = new Date(Date.now() + muteDuration);

            // Target is a wallet address for mute
            await db.collection('users').updateOne(
                { handle: targetId },
                { $set: { mutedUntil } }
            );
        }

        // Audit Log
        await db.collection('audit_log').insertOne({
            mod: modWallet,
            action,
            target: targetId,
            reason,
            timestamp: new Date()
        });

        res.json({ success: true });
    } catch (e) {
        console.error("Mod Action Error:", e);
        res.status(500).json({ error: "Action failed" });
    }
});


/* =========================================================================
   RAID OPS
   ========================================================================= */

// GET /api/community/raids/active
router.get('/raids/active', requireAuth, async (req, res) => {
    const raid = await db.collection('raids').findOne({ status: 'ACTIVE' });
    res.json(raid || null);
});

// GET /api/community/raids/recent
router.get('/raids/recent', requireAuth, async (req, res) => {
    const raids = await db.collection('raids')
        .find({ status: { $ne: 'ACTIVE' } })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
    res.json(raids);
});

// POST /api/community/raids/create (MOD/ADMIN)
router.post('/raids/create', requireAuth, async (req, res) => {
    const { targetUrl, objective, briefing, suggestedReplies } = req.body;
    const modWallet = req.session.wallet;

    const modUser = await db.collection('users').findOne({ handle: modWallet });
    if (!modUser || (modUser.role !== 'MOD' && modUser.role !== 'ADMIN')) {
        return res.status(403).json({ error: "Access denied" });
    }

    // Validate Cooldown
    const active = await db.collection('raids').findOne({ status: 'ACTIVE' });
    if (active) return res.status(400).json({ error: "Raid already active" });

    // Validate Cooldown (Global)
    const storedMeta = await db.collection('system_meta').findOne({ id: 'raid_cooldown' });
    if (storedMeta && new Date() < new Date(storedMeta.until) && modUser.role !== 'ADMIN') {
        return res.status(429).json({ error: "Global raid cooldown active" });
    }

    const raid = {
        targetUrl,
        objective, // AWARENESS | HOLDERS | CONVERSION | VOTE
        briefing: briefing.slice(0, 140),
        suggestedReplies: (suggestedReplies || []).slice(0, 3).map(s => s.slice(0, 220)),
        status: 'ACTIVE',
        createdBy: modWallet,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour default
        metrics: { clicks: 0, opens: 0, selfReports: 0 }
    };

    await db.collection('raids').insertOne(raid);

    // Broadcast new raid
    broadcast({ type: 'raid_start', data: raid });

    res.json({ success: true, raid });
});

// POST /api/community/raids/cancel (MOD/ADMIN)
router.post('/raids/cancel', requireAuth, async (req, res) => {
    const { raidId } = req.body;
    const modWallet = req.session.wallet;

    const modUser = await db.collection('users').findOne({ handle: modWallet });
    if (!modUser || (modUser.role !== 'MOD' && modUser.role !== 'ADMIN')) {
        return res.status(403).json({ error: "Access denied" });
    }

    let query = {};
    try {
        query = { _id: new ObjectId(raidId) };
    } catch {
        query = { _id: raidId };
    }

    const result = await db.collection('raids').updateOne(
        { ...query, status: 'ACTIVE' },
        { $set: { status: 'CANCELLED', endedAt: new Date(), endedBy: modWallet } }
    );

    if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Raid not found or not active" });
    }

    broadcast({ type: 'raid_cancel', raidId });
    res.json({ success: true });
});

// POST /api/community/raids/track
router.post('/raids/track', requireAuth, async (req, res) => {
    const { raidId, type } = req.body; // type: click | open | selfReport

    if (!['click', 'open', 'selfReports'].includes(type) && type !== 'selfReport') return res.status(400).json({ error: "Invalid type" });

    // Allow 'selfReport' to map to 'selfReports' metric key
    const metricKey = type === 'selfReport' ? 'selfReports' : type;

    // TODO: Sybil check / One per user per raid

    let query = {};
    try {
        query = { _id: new ObjectId(raidId) };
    } catch {
        query = { _id: raidId };
    }

    await db.collection('raids').updateOne(
        query,
        { $inc: { [`metrics.${metricKey}`]: 1 } }
    );
    res.json({ success: true });
});

export default router;
