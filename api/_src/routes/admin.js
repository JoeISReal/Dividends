import express from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';

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

// GET /api/admin/users - List all users with search/pagination
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const { search, page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = {};
        if (search) {
            query = {
                $or: [
                    { handle: { $regex: search, $options: 'i' } },
                    { displayName: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const users = await db.collection('users')
            .find(query)
            .sort({ lastActive: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .project({
                handle: 1,
                displayName: 1,
                role: 1,
                holderTier: 1,
                level: 1,
                lifetimeYield: 1,
                lastActive: 1,
                createdAt: 1,
                hiddenFromLeaderboard: 1
            })
            .toArray();

        const total = await db.collection('users').countDocuments(query);

        res.json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (e) {
        console.error("Admin Users List Error:", e);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// POST /api/admin/users/set-role - Set user role
router.post('/users/set-role', requireAdmin, async (req, res) => {
    try {
        const { handle, role } = req.body;

        if (!handle || !role) {
            return res.status(400).json({ error: "handle and role required" });
        }

        const VALID_ROLES = ['USER', 'MOD', 'ADMIN'];
        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
        }

        const result = await db.collection('users').updateOne(
            { handle },
            { $set: { role } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Audit log
        await db.collection('audit_log').insertOne({
            admin: req.session.wallet,
            action: 'SET_ROLE',
            target: handle,
            details: { newRole: role },
            timestamp: new Date()
        });

        res.json({ success: true, handle, role });
    } catch (e) {
        console.error("Set Role Error:", e);
        res.status(500).json({ error: "Failed to set role" });
    }
});

// GET /api/admin/audit-log - View audit log
router.get('/audit-log', requireAdmin, async (req, res) => {
    try {
        const { limit = 100 } = req.query;

        const logs = await db.collection('audit_log')
            .find({})
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .toArray();

        res.json(logs);
    } catch (e) {
        console.error("Audit Log Error:", e);
        res.status(500).json({ error: "Failed to fetch audit log" });
    }
});

// POST /api/admin/leaderboard/hide - Hide user from leaderboard
router.post('/leaderboard/hide', requireAdmin, async (req, res) => {
    const { targetHandle } = req.body;
    const adminWallet = req.session.wallet;

    try {
        const result = await db.collection('users').updateOne(
            { handle: targetHandle },
            { $set: { hiddenFromLeaderboard: true } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Audit log
        await db.collection('audit_log').insertOne({
            admin: adminWallet,
            action: 'HIDE_FROM_LEADERBOARD',
            target: targetHandle,
            timestamp: new Date()
        });

        res.json({ success: true });
    } catch (e) {
        console.error('Hide from leaderboard error:', e);
        res.status(500).json({ error: 'Failed to hide user' });
    }
});

// POST /api/admin/leaderboard/unhide - Unhide user from leaderboard
router.post('/leaderboard/unhide', requireAdmin, async (req, res) => {
    const { targetHandle } = req.body;
    const adminWallet = req.session.wallet;

    try {
        const result = await db.collection('users').updateOne(
            { handle: targetHandle },
            { $set: { hiddenFromLeaderboard: false } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Audit log
        await db.collection('audit_log').insertOne({
            admin: adminWallet,
            action: 'UNHIDE_FROM_LEADERBOARD',
            target: targetHandle,
            timestamp: new Date()
        });

        res.json({ success: true });
    } catch (e) {
        console.error('Unhide from leaderboard error:', e);
        res.status(500).json({ error: 'Failed to unhide user' });
    }
});

// POST /api/admin/users/reset-stats - Reset user stats (level, earnings, etc)
router.post('/users/reset-stats', requireAdmin, async (req, res) => {
    const { targetHandle } = req.body;
    const adminWallet = req.session.wallet;

    try {
        const result = await db.collection('users').updateOne(
            { handle: targetHandle },
            {
                $set: {
                    level: 1,
                    lifetimeYield: 0,
                    balance: 0,
                    yieldPerSecond: 0,
                    ownedManagers: [],
                    ownedUpgrades: [],
                    prestigeLevel: 0,
                    prestigeMultiplier: 1
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Audit log
        await db.collection('audit_log').insertOne({
            admin: adminWallet,
            action: 'RESET_USER_STATS',
            target: targetHandle,
            timestamp: new Date()
        });

        res.json({ success: true });
    } catch (e) {
        console.error('Reset stats error:', e);
        res.status(500).json({ error: 'Failed to reset stats' });
    }
});

// POST /api/admin/users/delete - Delete user account
router.post('/users/delete', requireAdmin, async (req, res) => {
    const { targetHandle } = req.body;
    const adminWallet = req.session.wallet;

    try {
        // Audit log before deletion
        await db.collection('audit_log').insertOne({
            admin: adminWallet,
            action: 'DELETE_USER',
            target: targetHandle,
            timestamp: new Date()
        });

        const result = await db.collection('users').deleteOne({ handle: targetHandle });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true });
    } catch (e) {
        console.error('Delete user error:', e);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

export default router;
