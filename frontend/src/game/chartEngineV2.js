// chartEngineV2.js - Fully Wired Version
export class ChartEngineV2 {
    constructor(engine, opts = {}) {
        this.engine = engine;
        this.engine.attachChart(this);

        this.candleMs = opts.candleMs || 300;
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

        this.updateCurrentCandle();

        if (this.forceRoll || this.candleElapsed >= this.candleMs) {
            this.rollCandle();
            this.forceRoll = false;
        }
    }

    updateCurrentCandle() {
        const p = this.engine.tickPrice();
        const c = this.currentCandle;

        c.live = p;
        c.high = Math.max(c.high, p);
        c.low = Math.min(c.low, p);
        c.close = p;
    }

    rollCandle() {
        this.candles.push({ ...this.currentCandle });
        if (this.candles.length > this.maxCandles) this.candles.shift();

        this.currentCandle = this.engineTickToCandle();
        this.candleElapsed = 0;
    }

    forceNewCandle() {
        this.forceRoll = true;
    }

    updateCamera(width) {
        const n = this.candles.length;
        const originX = width * 0.35;
        const lastRawX = originX + (n - 1) * this.candleWidth;
        const anchorX = width * 0.65;

        let desired = anchorX - lastRawX;

        if (n * this.candleWidth < width * 0.55) desired = 0;

        this.targetChartOffset = desired;
        this.chartOffset += (desired - this.chartOffset) * 0.08;
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

        if (minP === Infinity || maxP === -Infinity) {
            minP = 0.9;
            maxP = 1.1;
        }

        const pad = (maxP - minP) * 0.2;
        minP -= pad;
        maxP += pad;

        this.drawGrid(ctx, width, height, minP, maxP);
        this.drawCandles(ctx, width, height, minP, maxP);
        this.drawPriceLine(ctx, width, height, minP, maxP);
    }

    priceToY(price, minPrice, maxPrice, height) {
        const norm = (price - minPrice) / (maxPrice - minPrice);
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
        const originX = width * 0.35;

        for (let i = 0; i < this.candles.length; i++) {
            const c = this.candles[i];
            const x = originX + i * cw + this.chartOffset;

            if (x < -20 || x > width + 20) continue;

            const openY = this.priceToY(c.open, minP, maxP, height);
            const closeY = this.priceToY(c.close, minP, maxP, height);
            const highY = this.priceToY(c.high, minP, maxP, height);
            const lowY = this.priceToY(c.low, minP, maxP, height);

            const green = c.close >= c.open;

            // wick
            ctx.strokeStyle = green ? "#44ffb0" : "#ff5577";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, highY);
            ctx.lineTo(x, lowY);
            ctx.stroke();

            // body
            const top = green ? closeY : openY;
            const bot = green ? openY : closeY;
            const h = Math.max(3, bot - top);
            const w = cw * 0.6;

            ctx.fillStyle = green ? "#3bffb0" : "#ff6b81";
            ctx.fillRect(x - w / 2, top, w, h);
        }

        // draw live candle
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
        ctx.shadowColor = green ? "rgba(59,255,176,0.3)" : "rgba(255,75,106,0.3)";
        ctx.shadowBlur = 8;
        ctx.fillRect(x - cw * 0.35, top, cw * 0.7, Math.max(3, bot - top));
        ctx.shadowBlur = 0;
    }

    drawPriceLine(ctx, width, height, minP, maxP) {
        const y = this.priceToY(this.engine.price, minP, maxP, height);

        ctx.strokeStyle = "rgba(0,200,255,0.35)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawBreakevenLine(ctx, width, height, minP, maxP, entryPrice) {
        const y = this.priceToY(entryPrice, minP, maxP, height);

        ctx.save();

        // Dashed line
        ctx.strokeStyle = "rgba(255,215,0,0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label pill
        const label = 'BREAKEVEN';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        const textWidth = ctx.measureText(label).width;

        const pillWidth = textWidth + 16;
        const pillHeight = 18;
        const pillX = width - pillWidth - 8;
        const pillY = y - pillHeight / 2;

        ctx.fillStyle = "rgba(20,15,5,0.95)";
        ctx.strokeStyle = "rgba(255,215,0,0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 9);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffd700";
        ctx.fillText(label, pillX + 8, pillY + 13);

        ctx.restore();
    }
}
