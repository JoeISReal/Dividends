import { Player } from '../api/_src/models/Player.js';
import { Economy } from '../api/_src/modules/Economy.js';
import { STREAMS } from '../api/_src/data/GameData.js';

console.log("=== STARTING VERIFICATION ===");

// Helper to reset player
const getPlayer = () => new Player({
    streams: {
        'microbags': 0,
        'liquidity_pool': 0,
        'leverage_frog': 0,
        'chart_whisperer': 0,
        'whale_tracker': 0
    },
    streamAges: {}
});

// Test 1: Stability Calculation
console.log("\n--- TEST 1: Stability ---");
const p1 = getPlayer();
p1.streams['microbags'] = 10; // +1 * 10 = +10
p1.streams['leverage_frog'] = 5; // -5 * 5 = -25
// Base 100 + 10 - 25 = 85
let stab = Economy.calculateStability(p1);
console.log(`Stability (Exp: 85): ${stab}`);
if (stab === 85) console.log("PASS"); else console.error("FAIL");

// Test 2: Volatility Calculation
console.log("\n--- TEST 2: Volatility ---");
p1.streams['leverage_frog'] = 10; // 0.1 * 10 = +1.0
// Base 1.0 + 1.0 = 2.0
let vol = Economy.calculateVolatility(p1);
console.log(`Volatility (Exp: 2.0): ${vol}`);
if (Math.abs(vol - 2.0) < 0.001) console.log("PASS"); else console.error("FAIL");

// Test 3: Decay Logic
console.log("\n--- TEST 3: Decay ---");
const pDecay = getPlayer();
pDecay.streams['whale_tracker'] = 1; // Base Yield 450
pDecay.streamAges['whale_tracker'] = { ageSec: 0, lastTick: Date.now() };

let yield0 = Economy.calculateYield(pDecay);
console.log(`Yield T=0 (Exp: 450): ${yield0}`);

// Advance 60 seconds
pDecay.streamAges['whale_tracker'].ageSec = 60;
// Decay Rate 0.01 per minute. Exp(-0.01 * 1) = 0.990049
let expected = 450 * Math.exp(-0.01);
let yield60 = Economy.calculateYield(pDecay);
console.log(`Yield T=60s (Exp: ~${expected.toFixed(2)}): ${yield60.toFixed(2)}`);
if (yield60 < yield0 && yield60 > 400) console.log("PASS"); else console.error("FAIL");

// Test 4: Synergy Logic
console.log("\n--- TEST 4: Synergy ---");
const pSyn = getPlayer();
pSyn.streams['chart_whisperer'] = 10; // Base 5 * 10 = 50.
pSyn.streams['leverage_frog'] = 20; // Adds volatility. Vol = 1.0 + (20 * 0.1) = 3.0.
// Synergy check: 'volatility_boost'. Bonus = (Vol - 1). 3.0 - 1.0 = 2.0 (+200%)
// New Yield = 50 * (1 + 2.0) = 150.
let yieldSyn = Economy.calculateYield(pSyn);
console.log(`Yield w/ Synergy (Exp: >50 due to vol): ${yieldSyn}`);
// Only chart_whisperer yields here initially (frog yields too but we focus on chart).
// Base Yield Total is (5*10) + (32*20) = 50 + 640 = 690.
// With Synergy on Chart: 50 becomes 150. Total 150 + 640 = 790.
console.log(`Total Yield (Exp: ~790): ${yieldSyn}`);
if (yieldSyn > 690) console.log("PASS"); else console.error("FAIL");

// Test 5: XP & Levels
console.log("\n--- TEST 5: XP & Levels ---");
const xpP = getPlayer();
xpP.xp = 0;
console.log(`Lvl at 0 XP: ${Economy.getLevelFromXP(xpP.xp)}`); // 0

xpP.xp = 500;
// Lvl 0 -> 1 cost is 1000 * log(2)^1.4 ~ 1000 * 1^1.4 doesn't make sense? 
// log2(2) = 1. cost = 1000. 
// Wait, my formula logic might be off.
// Code: 1000 * Math.pow(Math.log2(level + 2), 1.4)
// Lvl 0->1: log2(2) = 1. 1^1.4 = 1. Cost = 1000.
// XP 500 < 1000. Should be Level 0.
console.log(`Lvl at 500 XP: ${Economy.getLevelFromXP(xpP.xp)}`); // 0

xpP.xp = 1500;
// 1500 > 1000. Level 1. 
// Remaining XP 500. 
// Cost Lvl 1->2: log2(3)=1.58. 1.58^1.4 = 1.9. Cost ~1900.
// 500 < 1900. Total Level 1.
console.log(`Lvl at 1500 XP: ${Economy.getLevelFromXP(xpP.xp)}`); // 1

// Test 6: Fatigue
console.log("\n--- TEST 6: Fatigue ---");
const pFat = getPlayer();
pFat.streams['arb_node'] = 1; // Stability -100. Total Stability = 0.
// Low Stability -> High Fatigue rate.
Economy.processFatigue(pFat, 10); // 10 seconds
console.log(`Fatigue after 10s heavy load: ${pFat.fatigue}`);
if (pFat.fatigue > 0) console.log("PASS"); else console.error("FAIL");

console.log("=== END VERIFICATION ===");
