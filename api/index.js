import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { Economy } from './_src/modules/Economy.js';
import { STREAMS, UPGRADES } from './_src/data/GameData.js';
import { EventSystem } from './_src/modules/Events.js';

const app = express();
app.set('trust proxy', 1); // Render/Vercel behind proxy

app.use(cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});


// MongoDB Configuration
const uri = process.env.MONGO_URI;

if (!uri) {
    console.error("ERROR: MONGO_URI is not set. Backend cannot start.");
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    } else {
        console.warn("Running in loose mode (no DB) just for health check test or local dev without .env");
    }
}

const client = uri ? new MongoClient(uri) : null;
let db;

// Health Check
app.get('/api/test/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Lazy Connection Middleware
app.use(async (req, res, next) => {
    if (db) return next();
    if (!client) {
        return res.status(503).json({ error: "Database not configured (MONGO_URI missing)" });
    }
    try {
        if (!client.topology || !client.topology.isConnected()) {
            await client.connect();
        }
        db = client.db('dividends_game');
        console.log("Connected to MongoDB Atlas");
        next();
    } catch (e) {
        console.error("Failed to connect to MongoDB", e);
        res.status(503).json({ error: "Database Connection Failed" });
    }
});

// --- API ---

// UNIFIED SYNC (Matches Vercel /api/sync)
app.post('/api/sync', async (req, res) => {
    const { handle, balance, lifetimeYield } = req.body;

    if (!db) return res.status(503).json({ error: "Database not connected" });
    const collection = db.collection('users');

    try {
        // 1. UPDATE LOGIC (if handle is present)
        if (handle) {
            const cleanHandle = handle.replace(/^@/, '');

            // Upsert
            await collection.updateOne(
                { handle: cleanHandle },
                {
                    $set: { lastActive: Date.now() },
                    $max: {
                        balance: balance || 0,
                        lifetimeYield: lifetimeYield || 0,
                        level: req.body.level || 1
                    },
                    $setOnInsert: {
                        handle: cleanHandle,
                        createdAt: Date.now()
                    }
                },
                { upsert: true }
            );
        }

        // 2. READ LEADERBOARD LOGIC
        const top50 = await collection
            .find({})
            .sort({ lifetimeYield: -1 })
            .limit(50)
            .project({ _id: 0, handle: 1, lifetimeYield: 1, displayName: 1, level: 1 })
            .toArray();

        res.json({ success: true, leaderboard: top50 });
    } catch (e) {
        console.error("Sync Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// LOGIN (Matches Vercel /api/auth/login)
app.post('/api/auth/login', async (req, res) => {
    const { handle } = req.body;
    if (!handle) return res.status(400).json({ error: 'Handle required' });

    if (!db) return res.status(503).json({ error: "Database not connected" });
    const collection = db.collection('users');

    try {
        const cleanHandle = handle.replace(/^@/, '');
        let user = await collection.findOne({ handle: cleanHandle });

        if (!user) {
            // Register new user with defaults
            user = {
                handle: cleanHandle,
                balance: 100, // Starting balance
                lifetimeYield: 0,
                yield: 0, // Current stored yield (not balance) ?? Maybe just balance
                // Game State defaults
                streams: {},
                upgrades: [],
                prestige: { multiplier: 1, resets: 0 },
                level: 1,
                lastActive: Date.now(),
                createdAt: Date.now()
            };
            await collection.insertOne(user);
        }
        res.json({ success: true, user });
    } catch (e) {
        console.error("Login Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// PROFILE UPDATE
app.post('/api/profile/update', async (req, res) => {
    const { handle, newDisplayName } = req.body;

    if (!db) return res.status(503).json({ error: "Database not connected" });
    if (!handle || !newDisplayName) {
        return res.status(400).json({ error: 'Missing handle or displayName' });
    }

    // Basic validation
    if (newDisplayName.length < 3 || newDisplayName.length > 20) {
        return res.status(400).json({ error: 'Name must be between 3 and 20 characters' });
    }

    const cleanHandle = handle.replace(/^@/, '');
    const cleanDisplayName = newDisplayName.trim();
    const collection = db.collection('users');

    try {
        const existing = await collection.findOne({
            displayName: { $regex: new RegExp(`^${cleanDisplayName}$`, 'i') },
            handle: { $ne: cleanHandle }
        });

        if (existing) {
            return res.status(409).json({ error: 'Display Name is already taken.' });
        }

        const result = await collection.updateOne(
            { handle: cleanHandle },
            {
                $set: {
                    displayName: cleanDisplayName,
                    lastActive: Date.now()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ success: true, displayName: cleanDisplayName });

    } catch (e) {
        console.error("Profile Update Error:", e);
        return res.status(500).json({ error: 'Database error' });
    }
});

// --- GAME LOGIC ROUTES (Migrated from app.js) ---

// Helper to get player from DB
async function getPlayer(handle) {
    if (!handle) return null;
    const cleanHandle = handle.replace(/^@/, '');
    return await db.collection('users').findOne({ handle: cleanHandle });
}

// GET STATE
app.get('/api/state', async (req, res) => {
    const handle = req.query.handle;
    if (!handle) {
        // Return a default/guest structure so it doesn't crash
        return res.json({
            player: {
                streams: {},
                upgrades: [],
                prestige: { multiplier: 1, resets: 0 },
                balance: 0,
                lastActive: Date.now()
            },
            meta: {
                yieldPerSecond: 0,
                streams: STREAMS,
                upgrades: UPGRADES,
                offlineEarnings: 0
            }
        });
    }

    const player = await getPlayer(handle);
    if (!player) return res.status(404).json({ error: "Player not found" });

    // Offline Earnings Logic
    const now = Date.now();
    const secondsOffline = Math.floor((now - (player.lastActive || now)) / 1000);
    let offlineEarnings = 0;

    if (secondsOffline > 10) {
        const yieldPerSec = Economy.calculateYield(player);
        offlineEarnings = yieldPerSec * secondsOffline;

        // Update player balance
        await db.collection('users').updateOne(
            { handle: player.handle },
            {
                $inc: { balance: offlineEarnings, lifetimeYield: offlineEarnings },
                $set: { lastActive: now }
            }
        );
        player.balance += offlineEarnings;
    } else {
        await db.collection('users').updateOne(
            { handle: player.handle },
            { $set: { lastActive: now } }
        );
    }

    res.json({
        player,
        meta: {
            yieldPerSecond: Economy.calculateYield(player),
            streams: STREAMS.map(s => ({
                ...s,
                currentCost: Economy.getStreamCost(s.id, player.streams?.[s.id] || 0)
            })),
            upgrades: UPGRADES.map(u => ({
                ...u,
                owned: player.upgrades?.includes(u.id)
            })),
            offlineEarnings
        }
    });
});

// BUY STREAM
app.post('/api/buy-stream', async (req, res) => {
    const { playerId, streamId, amount } = req.body;
    const handle = playerId;

    if (!handle) return res.status(400).json({ error: "Missing playerId" });

    const player = await getPlayer(handle);
    if (!player) return res.status(404).json({ error: "Player not found" });

    // Initialize streams if missing
    if (!player.streams) player.streams = {};

    const currentQty = player.streams[streamId] || 0;
    const qtyToBuy = amount || 1;

    let totalCost = 0;
    for (let i = 0; i < qtyToBuy; i++) {
        totalCost += Economy.getStreamCost(streamId, currentQty + i);
    }

    if (player.balance >= totalCost) {
        // Deduct balance, add stream
        player.streams[streamId] = currentQty + qtyToBuy;
        player.balance -= totalCost;

        await db.collection('users').updateOne(
            { handle: player.handle },
            {
                $set: {
                    [`streams.${streamId}`]: player.streams[streamId],
                    balance: player.balance
                }
            }
        );
        res.json({ success: true, player });
    } else {
        res.status(400).json({ success: false, reason: 'Insufficient funds' });
    }
});

// BUY UPGRADE
app.post('/api/buy-upgrade', async (req, res) => {
    const { playerId, key } = req.body;
    const handle = playerId;

    if (!handle) return res.status(400).json({ error: "Missing playerId" });

    const player = await getPlayer(handle);
    if (!player) return res.status(404).json({ error: "Player not found" });

    const upgrade = UPGRADES.find(u => u.id === key);
    if (!upgrade) return res.status(404).json({ success: false, reason: "Upgrade not found" });

    if (player.upgrades && player.upgrades.includes(key)) {
        return res.status(400).json({ success: false, reason: 'Already owned' });
    }

    if (player.balance >= upgrade.cost) {
        player.balance -= upgrade.cost;
        if (!player.upgrades) player.upgrades = [];
        player.upgrades.push(key);

        await db.collection('users').updateOne(
            { handle: player.handle },
            {
                $set: { balance: player.balance },
                $push: { upgrades: key }
            }
        );
        res.json({ success: true, player });
    } else {
        res.status(400).json({ success: false, reason: 'Insufficient funds' });
    }
});

// PRESTIGE
app.post('/api/prestige', async (req, res) => {
    const { playerId } = req.body;
    const handle = playerId;

    const player = await getPlayer(handle);
    if (!player) return res.status(404).json({ error: "Player not found" });

    const result = Economy.prestige(player);
    if (result.success) {
        // Save the RESET state
        await db.collection('users').updateOne(
            { handle: player.handle },
            {
                $set: {
                    yield: 0,
                    streams: {},
                    upgrades: [],
                    startTime: player.startTime,
                    prestige: player.prestige,
                    balance: 0
                }
            }
        );
        res.json({ success: true, player });
    } else {
        res.json(result);
    }
});

// RANDOM EVENT
app.get('/api/events/random', (req, res) => {
    const event = EventSystem.checkForEvent();
    res.json({ event });
});


// ADMIN: RESET LEADERBOARD
app.post('/api/admin/reset', async (req, res) => {
    if (!db) return res.status(503).json({ error: "DB not connected" });
    try {
        await db.collection('users').deleteMany({});
        console.log("Values reset.");
        res.json({ success: true, message: "Leaderboard and all users wiped." });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3001;
// Only start server if NOT on Vercel (Vercel exports app instead)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
});

export default app;
