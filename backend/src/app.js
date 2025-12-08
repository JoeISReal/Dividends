import express from 'express';
import cors from 'cors';
import { Player } from './models/Player.js';
import { Economy } from './modules/Economy.js';
import { EventSystem } from './modules/Events.js';
import { STREAMS, UPGRADES } from './data/GameData.js';

const app = express();
app.use(cors());
app.use(express.json());

// --- Routes ---

// Get Full State (Sync)
app.get('/api/state', (req, res) => {
    const player = Player.load();

    // Calculate offline earnings
    const now = Date.now();
    const secondsOffline = Math.floor((now - player.lastActive) / 1000);
    let offlineEarnings = 0;

    if (secondsOffline > 10) { // Minimum 10s for offline calc
        const yieldPerSec = Economy.calculateYield(player);
        offlineEarnings = yieldPerSec * secondsOffline;
        player.addYield(offlineEarnings);
    }

    player.lastActive = now;
    player.save();

    res.json({
        player,
        meta: {
            yieldPerSecond: Economy.calculateYield(player),
            streams: STREAMS.map(s => ({
                ...s,
                currentCost: Economy.getStreamCost(s.id, player.streams[s.id] || 0)
            })),
            upgrades: UPGRADES.map(u => ({
                ...u,
                owned: player.upgrades.includes(u.id)
            })),
            offlineEarnings
        }
    });
});

// Save State (Heartbeat)
app.post('/api/state/save', (req, res) => {
    const player = Player.load();
    // In a real app, we'd validate the payload. 
    // For this idle game, we trust the backend calc mostly, 
    // but we can update lastActive.
    player.lastActive = Date.now();
    player.save();
    res.json({ success: true });
});

// Buy Stream
app.post('/api/buy-stream', (req, res) => {
    const { streamId } = req.body;
    const player = Player.load();
    const currentQty = player.streams[streamId] || 0;
    const cost = Economy.getStreamCost(streamId, currentQty);

    if (player.spend(cost)) {
        player.streams[streamId] = currentQty + 1;
        player.save();
        res.json({ success: true, player });
    } else {
        res.status(400).json({ success: false, reason: 'Insufficient funds' });
    }
});

// Buy Upgrade
app.post('/api/buy-upgrade', (req, res) => {
    const { upgradeId } = req.body;
    const player = Player.load();
    const upgrade = UPGRADES.find(u => u.id === upgradeId);

    if (!upgrade) return res.status(404).json({ success: false });
    if (player.upgrades.includes(upgradeId)) return res.status(400).json({ success: false, reason: 'Already owned' });

    if (player.spend(upgrade.cost)) {
        player.upgrades.push(upgradeId);
        player.save();
        res.json({ success: true, player });
    } else {
        res.status(400).json({ success: false, reason: 'Insufficient funds' });
    }
});

// Prestige
app.post('/api/prestige', (req, res) => {
    const player = Player.load();
    const result = Economy.prestige(player);
    res.json(result);
});

// Random Event
app.get('/api/events/random', (req, res) => {
    const event = EventSystem.checkForEvent();
    res.json({ event });
});

export default app;
