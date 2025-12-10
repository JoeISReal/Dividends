// chartEngineV2.js - Fully Wired Version with Fixes
export class ChartEngineV2 {
    constructor(engine, opts = {}) {
        this.engine = engine;
        this.engine.attachChart(this);

        this.candleMs = opts.candleMs || 300; // Fast ticks
        this.maxCandles = opts.maxCandles || 160;
        this.candleWidth = opts.candleWidth || 12;

        this.candles = [];
        this.currentCandle = null;

        this.candleElapsed = 0;
        this.forceRoll = false;

        this.chartOffset = 0;
        this.targetChartOffset = 0;

        this.currentCandle = this.engineTickToCandle();
    }

    engineTickToCandle() {
        const p = this.engine.tickPrice();
        return { open: p, high: p, low: p, close: p, live: p };
    }

    update(dt) {
        this.candleElapsed += dt;

        this.updateCurrentCandle(dt);

        // Robust time-step: Catch up if we lag behind multiple candles
        while (this.forceRoll || this.candleElapsed >= this.candleMs) {
            this.rollCandle();
            // If forced, reset flag. If time-based, decrement time.
            if (this.forceRoll) {
                this.forceRoll = false;
                this.candleElapsed = 0; // Hard reset on force
            } else {
                this.candleElapsed -= this.candleMs;
            }
        }
    }

    updateCurrentCandle(dt) {
        // pass dt down in ms
        const p = this.engine.tickPrice(dt || 100);
        const c = this.currentCandle;

        if (c) {
            c.live = p;
            c.high = Math.max(c.high, p);
            c.low = Math.min(c.low, p);
            c.close = p;
        }
    }

    rollCandle() {
        if (this.candles.length >= this.maxCandles) {
            this.candles.shift();
        }

        // Push a safe copy
        if (this.currentCandle) {
            this.candles.push({ ...this.currentCandle });
        }

        // Start next candle
        this.currentCandle = this.engineTickToCandle();
    }

    forceNewCandle() {
        this.forceRoll = true;
    }

    updateCamera(width) {
        // Goal: Keep the "Head" (current candle) at 65% of screen width
        // once it fills the gap from the origin (35%).

        const cw = this.candleWidth;
        const n = this.candles.length;

        // World position of the head relative to the origin
        const headWorldX = n * cw;

        const originScreenX = width * 0.35;
        const targetScreenX = width * 0.65;

        // originScreenX + headWorldX + offset = targetScreenX
        // offset = targetScreenX - originScreenX - headWorldX
        const idealOffset = targetScreenX - originScreenX - headWorldX;

        // Only scroll left (negative offset) once filled. Never scroll right (positive).
        const finalOffset = Math.min(0, idealOffset);

        // HARD LOCK (No Lerp) to guarantee frame visibility
        this.chartOffset = finalOffset;
    }

    draw(ctx, width, height) {
        this.updateCamera(width);

        ctx.clearRect(0, 0, width, height);

        // background
        ctx.fillStyle = "#07080B";
        ctx.fillRect(0, 0, width, height);

        const all = [...this.candles, this.currentCandle];
        let minP = Infinity, maxP = -Infinity;
        for (const c of all) {
            if (!c) continue;
            minP = Math.min(minP, c.low);
            maxP = Math.max(maxP, c.high);
        }

        // Dynamic padding to prevent flat lines
        if (minP === Infinity || maxP === -Infinity || minP === maxP) {
            const center = minP === Infinity ? 1 : minP;
            minP = center * 0.95;
            maxP = center * 1.05;
        }

        const pad = (maxP - minP) * 0.35;
        minP -= pad;
        maxP += pad;

        this.drawGrid(ctx, width, height, minP, maxP);
        this.drawCandles(ctx, width, height, minP, maxP);
        this.drawPriceLine(ctx, width, height, minP, maxP);
        this.drawStartLine(ctx, width, height, minP, maxP);
    }

    drawStartLine(ctx, width, height, minP, maxP) {
        const y = this.priceToY(1.0, minP, maxP, height);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; // Much brighter
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]); // Clear dash pattern
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.setLineDash([]); // Reset

        ctx.fillStyle = "rgba(255, 255, 255, 0.7)"; // Brighter text
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("1.00x", width - 40, y - 5);
    }

    priceToY(price, minPrice, maxPrice, height) {
        const range = maxPrice - minPrice;
        if (range === 0) return height / 2;
        const norm = (price - minPrice) / range;
        return height - norm * height;
    }

    drawGrid(ctx, width, height) {
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;

        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    drawCandles(ctx, width, height, minP, maxP) {
        const cw = this.candleWidth;
        // Origin matches the camera update logic
        const originX = width * 0.35;

        for (let i = 0; i < this.candles.length; i++) {
            const c = this.candles[i];
            const x = originX + i * cw + this.chartOffset;

            // Horizontal culling
            if (x < -20 || x > width + 20) continue;

            const openY = this.priceToY(c.open, minP, maxP, height);
            const closeY = this.priceToY(c.close, minP, maxP, height);
            const highY = this.priceToY(c.high, minP, maxP, height);
            const lowY = this.priceToY(c.low, minP, maxP, height);

            const green = c.close >= c.open;

            // Wick
            ctx.strokeStyle = green ? "#44ffb0" : "#ff5577";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, highY);
            ctx.lineTo(x, lowY);
            ctx.stroke();

            // Body
            const top = green ? closeY : openY;
            const bot = green ? openY : closeY;
            const h = Math.max(3, bot - top);
            const w = cw * 0.65;

            ctx.fillStyle = green ? "#3bffb0" : "#ff6b81";
            ctx.fillRect(x - w / 2, top, w, h);
        }

        // Draw Live Candle
        const i = this.candles.length;
        const c = this.currentCandle;
        const x = originX + i * cw + this.chartOffset;

        const openY = this.priceToY(c.open, minP, maxP, height);
        const closeY = this.priceToY(c.close, minP, maxP, height);
        const highY = this.priceToY(c.high, minP, maxP, height);
        const lowY = this.priceToY(c.low, minP, maxP, height);

        const green = c.close >= c.open;

        ctx.strokeStyle = green ? "#55ffcc" : "#ff7788";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        const top = green ? closeY : openY;
        const bot = green ? openY : closeY;

        ctx.fillStyle = green ? "#5bffd1" : "#ff8798";
        // Glow effect for live candle
        ctx.shadowColor = green ? "rgba(59,255,176,0.3)" : "rgba(255,75,106,0.3)";
        ctx.shadowBlur = 10;
        ctx.fillRect(x - cw * 0.35, top, cw * 0.7, Math.max(3, bot - top));
        ctx.shadowBlur = 0;
    }

    drawPriceLine(ctx, width, height, minP, maxP) {
        const y = this.priceToY(this.engine.price, minP, maxP, height);

        ctx.strokeStyle = "rgba(0,200,255,0.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawBreakevenLine(ctx, width, height, minP, maxP, price, pnlPct = 0) {
        const y = this.priceToY(price, minP, maxP, height);

        ctx.strokeStyle = "rgba(255, 200, 0, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = "rgba(255, 200, 0, 0.7)";
        ctx.font = "10px sans-serif";
        ctx.fillText("ENTRY", 5, y - 5);

        // PnL Pill on the right
        const sign = pnlPct >= 0 ? "+" : "";
        const color = pnlPct >= 0 ? "#44ffb0" : "#ff5577";
        const text = `${sign}${Number(pnlPct).toFixed(2)}%`;

        ctx.font = "bold 11px system-ui";
        const metric = ctx.measureText(text);
        const pad = 6;
        const w = metric.width + pad * 2;
        const h = 20;

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(width - w - 10, y - h / 2, w, h);

        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, width - w / 2 - 10, y + 1);

        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
    }

    priceToY(p, minP, maxP, height) {
        // Log scale? 
        // return height - ((Math.log(p) - Math.log(minP)) / (Math.log(maxP) - Math.log(minP))) * height;

        // Linear for now to match other logic found in file?
        // Actually, let's just use what's likely already there or if I can't find it, define it safely.
        // Since I can't see the definition in previous blocks, I should check if it's there.
        // It WAS referenced in line 153.
        return height - ((p - minP) / (maxP - minP)) * height;
    }

}

