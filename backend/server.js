const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'data', 'leaderboard.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Load DB
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    return { users: [] };
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --- API ---

// SIMULATED LOGIN
// In a real app, this would verify a token.
// Here, we just trust the handle for the prototype.
app.post('/api/auth/login', (req, res) => {
  const { handle } = req.body;
  if (!handle) return res.status(400).json({ error: 'Handle required' });

  const db = loadDB();
  let user = db.users.find(u => u.handle.toLowerCase() === handle.toLowerCase());

  if (!user) {
    // Register new user
    user = {
      handle,
      balance: 0,
      lifetimeYield: 0,
      lastActive: Date.now()
    };
    db.users.push(user);
    saveDB(db);
  }

  res.json({ success: true, user });
});

// UPDATE SCORE
app.post('/api/score', (req, res) => {
  const { handle, balance, lifetimeYield } = req.body;
  if (!handle) return res.status(400).json({ error: 'Handle required' });

  const db = loadDB();
  const user = db.users.find(u => u.handle.toLowerCase() === handle.toLowerCase());

  if (user) {
    // Update high scores (only if higher)
    user.balance = Math.max(user.balance || 0, balance || 0);
    user.lifetimeYield = Math.max(user.lifetimeYield || 0, lifetimeYield || 0);
    user.lastActive = Date.now();
    saveDB(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// GET LEADERBOARD
app.get('/api/leaderboard', (req, res) => {
  const db = loadDB();
  // Sort by Lifetime Yield desc
  const sorted = [...db.users].sort((a, b) => (b.lifetimeYield || 0) - (a.lifetimeYield || 0));
  // Top 50
  const top50 = sorted.slice(0, 50);
  res.json(top50);
});

const PORT = 3001;
const server = app.listen(PORT, () => {
  console.log(`Leaderboard Server running on port ${PORT}`);
  console.log('Press Ctrl+C to stop');
});

server.on('error', (e) => {
  console.error('SERVER ERROR:', e);
});

// Keep process alive hack (in case something is closing it)
setInterval(() => { }, 10000);

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
