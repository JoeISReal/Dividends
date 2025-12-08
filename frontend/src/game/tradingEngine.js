//------------------------------------------------------------
// TRADING ENGINE V2 — Fully Wired with Bots
//------------------------------------------------------------

export class TradingEngine {
    constructor() {
        this.price = 1.0;
        this.baseVol = 0.04;             // slot-game excitement
        this.momentum = 0;
        this.liquidity = 3000;
        this.cooldownMs = 180;
        this.lastTrade = 0;

        this.chart = null; // will be attached later

        // mood engine - SLOT GAME MODE: fast, volatile, exciting!
        this.moods = [
            { name: "bleed", drift: -0.025, vol: 0.05, dur: [3, 8] },
            { name: "flat", drift: 0.002, vol: 0.03, dur: [2, 5] },
            { name: "recover", drift: 0.02, vol: 0.04, dur: [3, 7] },
            { name: "pump", drift: 0.12, vol: 0.1, dur: [1, 3] },
            { name: "rug", drift: -0.18, vol: 0.2, dur: [1, 2] }
        ];

        // 🔥 AI trading bots
        this.bots = [
            { name: "WhaleGod", bias: 0.55, sizeRange: [800, 2000], paceRange: [900, 1800], nextTradeAt: 0 },
            { name: "DipBuyer", bias: 0.65, sizeRange: [200, 700], paceRange: [600, 1600], nextTradeAt: 0 },
            { name: "RugPuller", bias: 0.35, sizeRange: [500, 1500], paceRange: [800, 2000], nextTradeAt: 0 },
            { name: "ScalpGoblin", bias: 0.50, sizeRange: [80, 260], paceRange: [250, 900], nextTradeAt: 0 },
        ];

        this.pickMood();
    }

    attachChart(chart) {
        this.chart = chart;
    }

    pickMood() {
        this.mood = this.moods[Math.floor(Math.random() * this.moods.length)];
        this.moodTicks = 0;
        this.moodDuration = Math.floor(
            Math.random() * (this.mood.dur[1] - this.mood.dur[0]) + this.mood.dur[0]
        );
    }

    runBots() {
        const now = performance.now();

        for (const bot of this.bots) {
            if (!bot.nextTradeAt || now >= bot.nextTradeAt) {
                // schedule next trade
                const [minP, maxP] = bot.paceRange;
                const delay = Math.random() * (maxP - minP) + minP;
                bot.nextTradeAt = now + delay;

                // decide buy or sell
                const buyChance = bot.bias;
                const isBuy = Math.random() < buyChance;

                // trade size
                const [minS, maxS] = bot.sizeRange;
                const size = Math.random() * (maxS - minS) + minS;

                // apply trade as bot
                this.applyTrade(size, isBuy ? "buy" : "sell", true);
            }
        }
    }

    tickPrice() {
        if (this.moodTicks >= this.moodDuration) this.pickMood();

        // 🔥 bots influence price before natural drift
        this.runBots();

        let change = this.mood.drift;

        const wiggle = (Math.random() - 0.5) * this.mood.vol;
        change += wiggle;

        change += this.momentum;

        // SLOT GAME MECHANIC: Random spikes for excitement!
        if (Math.random() < 0.02) {
            change += (Math.random() * 0.15) * (Math.random() < 0.5 ? 1 : -1);
        }

        // STRONGER upward bias when below 1x
        if (this.price < 1.0) {
            change += 0.012;
        }

        // slow highs / long lows modifiers (less restrictive for slot feel)
        if (this.price > 5 && change > 0) change *= 0.5;
        if (this.price < 0.5 && change < 0) change *= 1.3;

        this.price += change;
        this.price = Math.max(0.01, this.price);

        // Mean reversion toward 1.0x
        const reversion = (this.price - 1.0) * 0.01;
        this.price -= reversion;

        this.momentum *= 0.9;
        this.moodTicks++;

        return this.price;
    }

    applyTrade(amount, type, fromBot = false) {
        const now = performance.now();
        if (!fromBot && now - this.lastTrade < this.cooldownMs) return this.price;
        this.lastTrade = now;

        const isBuy = type === "buy";
        let impact = amount / this.liquidity;

        if (isBuy) impact = +impact;
        else impact = -impact * 1.25;

        this.price *= (1 + impact);
        this.momentum += impact * 0.3;

        this.price -= (this.price - 1) * 0.0025;

        this.baseVol += Math.abs(impact) * 0.02;
        this.baseVol = Math.min(this.baseVol, 0.2);

        this.price = Math.max(0.01, this.price);

        // 🔥 only user trades create fresh candles
        if (!fromBot && this.chart) {
            this.chart.forceNewCandle();
        }

        return this.price;
    }

    buildCandle(prevCandle, currentPrice) {
        if (!prevCandle) {
            return {
                open: currentPrice,
                high: currentPrice,
                low: currentPrice,
                close: currentPrice,
                live: currentPrice,
                timestamp: Date.now()
            };
        }

        prevCandle.live = currentPrice;
        prevCandle.high = Math.max(prevCandle.high, currentPrice);
        prevCandle.low = Math.min(prevCandle.low, currentPrice);
        prevCandle.close = currentPrice;

        return prevCandle;
    }
}
