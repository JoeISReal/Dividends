// src/game/tradingEngine.js
import { NoiseField } from "../engine/noiseField";
import { XPSystem } from "./xpSystem";

export class TradingEngine {
    constructor(opts = {}) {
        this.price = 1.0;

        // "volatility" is how much noise moves price
        this.baseVol = opts.baseVol ?? 0.15;
        this.volatility = this.baseVol;

        // smooth trend component
        this.momentum = 0;

        // for user trade impact
        this.liquidity = opts.liquidity ?? 3000;
        this.cooldownMs = opts.cooldownMs ?? 140;
        this.lastTrade = 0;

        // time + noise
        this.time = 0; // seconds
        this.timeScale = opts.timeScale ?? 1.0;
        this.noise = new NoiseField(opts.seed ?? 1337);

        this.chart = null; // attached by ChartEngineV2
        this.xpSystem = new XPSystem(); // Local instance to calc, but we need to feed it back to store

        // "moods" give macro drift - EXTREME SWINGS
        this.moods = [
            { name: "sideways", drift: 0.004, volMul: 1.0, dur: [5, 12], weight: 5 },
            { name: "chop", drift: 0.000, volMul: 1.4, dur: [6, 14], weight: 5 },
            { name: "recover", drift: 0.070, volMul: 1.3, dur: [8, 18], weight: 4 },
            { name: "pump", drift: 0.250, volMul: 2.0, dur: [4, 8], weight: 3 },
            { name: "bleed", drift: -0.080, volMul: 1.5, dur: [6, 14], weight: 3 },
            { name: "rug", drift: -0.800, volMul: 4.0, dur: [3, 6], weight: 2 }, // BUFFED: Very violent drop
        ];

        // Start with sideways mood
        this.pickMood();
    }

    attachChart(chart) {
        this.chart = chart;
    }

    pickMood() {
        const totalWeight = this.moods.reduce((sum, m) => sum + m.weight, 0);
        let r = Math.random() * totalWeight;

        for (const m of this.moods) {
            if (r < m.weight) {
                this.mood = m;
                break;
            }
            r -= m.weight;
        }

        // Mood duration set
        this.moodTicks = 0;
        this.moodDuration = Math.floor(
            Math.random() * (this.mood.dur[1] - this.mood.dur[0]) + this.mood.dur[0]
        );
    }

    /**
     * Core price step.
     * dtMs = delta time in milliseconds from the chart loop.
     */
    tickPrice(dtMs = 100) {
        // Advance time in seconds (scaled)
        const dtSec = (dtMs / 1000) * this.timeScale;
        this.time += dtSec;

        // Periodically change mood
        if (this.moodTicks >= this.moodDuration) {
            this.pickMood();
        }

        // Autonomous volatility drift
        this.volatility += (Math.random() - 0.5) * 0.01;
        this.volatility = Math.max(this.baseVol * 0.5, Math.min(this.volatility, this.baseVol * 6));

        // Sample smooth noise
        const noiseVal = this.noise.sample(this.time);

        // Base drift from mood
        let change = this.mood.drift * dtSec;

        // ADDED: Wiggle factor from super-prompt
        const wiggle = (Math.random() - 0.5) * this.mood.volMul * (1 + Math.random() * 0.6);
        change += wiggle * 0.005; // tiny micro noise

        // Noise-based deviation scaled by volatility + mood
        const effectiveVol = this.volatility * this.mood.volMul;
        change += noiseVal * effectiveVol;

        // Momentum decays slowly but biases direction
        change += this.momentum * dtSec;

        // Soft clamps
        if (this.price > 8 && change > 0) change *= 0.5;
        if (this.price < 0.2 && change < 0) change *= 0.5;

        // Apply change
        this.price += change;
        this.price = Math.max(0.1, Math.min(this.price, 10));

        // Momentum decay (V2 Tuning)
        // this.momentum *= 0.985; // Old
        this.momentum *= 0.94; // New stricter decay

        // Reversion (V2 Tuning)
        this.price -= (this.price - 1) * 0.0010;

        this.moodTicks += dtSec;

        return this.price;
    }

    /**
     * User trade: amount is bet size.
     * type = "buy" | "sell"
     * isBot = boolean
     */
    applyTrade(amount, type, isBot = false) {
        const now = performance.now();
        if (now - this.lastTrade < this.cooldownMs && !isBot) return this.price;
        if (!isBot) this.lastTrade = now;

        const isBuy = type === "buy";

        let impact = amount / this.liquidity;
        if (!isBuy) {
            impact = -impact * 1.25;
        }

        // Multiply price by impact factor
        this.price *= 1 + impact;

        // Feed impact into momentum
        this.momentum += impact * 1.2;

        // Increase volatility
        this.volatility += Math.abs(impact) * 0.05;
        this.volatility = Math.min(this.volatility, this.baseVol * 3);

        this.price = Math.max(0.1, Math.min(this.price, 10));

        // XP System Hook
        if (!isBot && this.xpSystem) {
            const xp = this.xpSystem.calculateTradeXP(amount, this.volatility, this.momentum);
            if (xp > 0 && this.onAwardXP) {
                this.onAwardXP(xp);
            }
        }

        return this.price;
    }
}
