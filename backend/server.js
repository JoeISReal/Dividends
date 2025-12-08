// dividends/backend/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const DB = path.join(process.cwd(), 'game_state.json');
function loadState() {
  if (!fs.existsSync(DB)) {
    const initial = {
      balance: 0,
      yieldPerClick: 1,
      yieldPerSecond: 0,
      shareholderMultiplier: 1,
      streams: [
        { id: 'shoveler', name: 'Shitcoin Shoveler', description: 'Tiny farms of meme coins', baseCost: 10, costMult: 1.07, owned: 0, productionTime: 1, baseYield: 0.5 },
        { id: 'candle', name: 'Candle Reader', description: 'Short-term pattern AI', baseCost: 100, costMult: 1.07, owned: 0, productionTime: 3, baseYield: 10 },
        { id: 'goblin', name: 'Leverage Goblin', description: 'High-risk leverage rigs', baseCost: 500, costMult: 1.08, owned: 0, productionTime: 5, baseYield: 50 },
        { id: 'botrack', name: 'Trader Bot Rack', description: 'Auto scalp bots', baseCost: 2500, costMult: 1.09, owned: 0, productionTime: 7, baseYield: 250 },
        { id: 'arb', name: 'Arbitrage Node', description: 'Cross-market arb engine', baseCost: 15000, costMult: 1.1, owned: 0, productionTime: 12, baseYield: 1200 }
      ],
      upgrades: {},
      upgradesCatalog: [
        { key: 'faster_clicks', name: 'Faster Clicks', desc: '+1 click yield', cost: 500 },
        { key: 'shoveler_boost', name: 'Shoveler Boost', desc: 'Shoveler yield ×2', cost: 1000 },
        { key: 'global_mult', name: 'Tokenomics R&D', desc: 'Global yield +10%', cost: 5000 }
      ],
      stats: { lifetimeYield: 0, totalClicks: 0 },
      lastTick: Date.now()
    };
    fs.writeFileSync(DB, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB));
}
function saveState(s) { fs.writeFileSync(DB, JSON.stringify(s, null, 2)); }

let state = loadState();

const app = express();
app.use(cors());
app.use(express.json());

function computeYPS() {
  let total = 0;
  state.streams.forEach(st => {
    const owned = st.owned || 0;
    let mult = 1;
    if (state.upgrades[`${st.id}_mult`]) mult *= (1 + 0.5 * state.upgrades[`${st.id}_mult`]);
    if (state.upgrades['global_mult']) mult *= (1 + 0.1 * state.upgrades['global_mult']);
    total += (st.baseYield * owned / Math.max(1, st.productionTime)) * mult;
  });
  total *= (state.shareholderMultiplier || 1);
  state.yieldPerSecond = total;
  return total;
}

// tick loop 1s
setInterval(() => {
  const now = Date.now();
  const elapsed = Math.floor((now - state.lastTick) / 1000);
  if (elapsed <= 0) return;
  const yps = computeYPS();
  const gained = yps * elapsed;
  if (gained > 0) {
    state.balance = Number(state.balance) + gained;
    state.stats.lifetimeYield = (state.stats.lifetimeYield || 0) + gained;
  }
  state.lastTick = now;
  saveState(state);
}, 1000);

app.get('/api/state', (req, res) => {
  computeYPS();
  saveState(state);
  res.json(state);
});

app.post('/api/buy-stream', (req, res) => {
  const { streamId, amount = 1 } = req.body;
  const st = state.streams.find(s => s.id === streamId);
  if (!st) return res.status(404).json({ error: 'stream not found' });
  const cost = Math.floor(st.baseCost * Math.pow(st.costMult, st.owned));
  if (state.balance < cost) return res.status(400).json({ error: 'insufficient' });
  state.balance -= cost;
  st.owned += amount;
  saveState(state);
  res.json({ ok: true, state });
});

app.post('/api/buy-upgrade', (req, res) => {
  const { key } = req.body;
  const catalog = state.upgradesCatalog.find(u => u.key === key);
  if (!catalog) return res.status(404).json({ error: 'upgrade not found' });
  if (state.balance < catalog.cost) return res.status(400).json({ error: 'insufficient' });
  state.balance -= catalog.cost;
  state.upgrades[key] = (state.upgrades[key] || 0) + 1;
  saveState(state);
  res.json({ ok: true, state });
});

app.post('/api/prestige', (req, res) => {
  const bonus = Math.max(0, Math.floor(Math.log10(Math.max(1, state.stats.lifetimeYield))) * 0.25);
  state.shareholderMultiplier = (state.shareholderMultiplier || 1) + bonus;
  // reset progress
  state.balance = 0;
  state.streams.forEach(s => s.owned = 0);
  state.upgrades = {};
  state.stats = { lifetimeYield: 0, totalClicks: 0 };
  saveState(state);
  res.json({ ok: true, shareholderMultiplier: state.shareholderMultiplier });
});

app.listen(3000, () => {
  console.log('Backend running on port 3000');
});
