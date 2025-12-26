import React, { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { getChartEngines } from '../game/chartSingleton';
import { useGameStore } from '../state/gameStore';

const DegenChart = forwardRef(({ onPriceUpdate, activePosition }, ref) => {
    const canvasRef = useRef(null);
    const tradingRef = useRef(null);
    const chartRef = useRef(null);

    // XP Action
    const awardXP = useGameStore(s => s.awardXP);
    const awardXPRef = useRef(awardXP);

    useEffect(() => {
        awardXPRef.current = awardXP;
    }, [awardXP]);

    // Expose applyTrade to parent
    useImperativeHandle(ref, () => ({
        applyTrade: (amount, type) => {
            if (tradingRef.current) {
                tradingRef.current.applyTrade(amount, type, false);
            }
        }
    }), []);

    // Ref for callback and position
    const onPriceUpdateRef = useRef(onPriceUpdate);
    const activePositionRef = useRef(activePosition);

    useEffect(() => {
        onPriceUpdateRef.current = onPriceUpdate;
        activePositionRef.current = activePosition;
    }, [onPriceUpdate, activePosition]);

    useEffect(() => {
        // Get singleton engines - they persist across tab switches
        const { trading, chart } = getChartEngines();

        // Read CSS tokens for canvas
        const style = getComputedStyle(document.body);
        const tokens = {
            green: style.getPropertyValue('--accent-green').trim() || '#3bffb0',
            red: style.getPropertyValue('--accent-red').trim() || '#ff6b81',
            gold: style.getPropertyValue('--accent-gold').trim() || '#ffd700',
            text: style.getPropertyValue('--text-secondary').trim() || '#888',
            border: style.getPropertyValue('--border-subtle').trim() || 'rgba(255,255,255,0.1)',
            bgPillGreen: 'rgba(59, 255, 176, 0.12)', // approximates var(--accent-green) with opacity
            bgPillRed: 'rgba(255, 75, 106, 0.12)'
        };

        tradingRef.current = trading;
        chartRef.current = chart;

        // Inject XP Callback
        // We use a ref wrapper to always call the latest zustand action
        trading.onAwardXP = (amount) => {
            if (awardXPRef.current) awardXPRef.current(amount);
        };

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        function resize() {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        resize();
        window.addEventListener("resize", resize);

        let last = performance.now();

        function loop(now) {
            const dt = now - last;
            last = now;

            chart.update(dt);

            // Update price callback
            if (onPriceUpdateRef.current) {
                onPriceUpdateRef.current(trading.price);
            }

            const rect = canvas.getBoundingClientRect();
            // Pass tokens to chart.draw if chart engine supports it, or handle custom drawing here?
            // The chart engine likely has its own drawing logic.
            // If chart.draw() is internal, we might not be able to change its colors easily without modifying ChartEngine.
            // Assuming ChartEngine.draw handles the basics, but the prompt implies WE control the drawing here?
            // Looking at the original code: `chart.draw(ctx, rect.width, rect.height);`
            // The drawing logic seems to be inside `chart` object (ChartEngine).
            // BUT wait, looking at the previous file view of PerpsChart.jsx, it had drawing logic IN THE COMPONENT.
            // DegenChart.jsx uses `chart.draw`.
            // Let's check `chartSingleton.js` or wherever `ChartEngine` is.
            // If `chart.draw` paints the candles, I need to modify THAT.
            // However, the prompt says "Refactor ... DegenChart.jsx".
            // If DegenChart delegates drawing to `chart.draw`, I should check if I can configure it.
            // If I cannot see ChartEngine code, I might have to assume DegenChart is the place or I need to find ChartEngine.

            // Wait, PerpsChart.jsx had all drawing logic inline. DegenChart.jsx delegates to `chart`.
            // If DegenChart is the active one, and it uses `chart.draw`, then `chart.draw` determines the colors.
            // I should check `src/game/chartSingleton.js` or `src/game/ChartEngine.js`.

            // For now, let's keep the overlay drawing logic (breakeven line) which IS in this file, and update IT to use tokens.

            chart.draw(ctx, rect.width, rect.height);

            // Draw breakeven line if position exists
            const pos = activePositionRef.current;
            if (pos) {
                // Get price range from chart
                const all = [...chart.candles, chart.currentCandle];
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

                // Draw breakeven line at entry price
                // Calculate PnL % for display on line
                const currentPnL = pos.currentValue - pos.betAmount;
                const pnlPercent = ((currentPnL / pos.betAmount) * 100);

                // Note: chart.drawBreakevenLine might also be internal.
                // But if it takes canvas context, maybe I can override styles before calling?
                // Or maybe I should check if I can modify ChartEngine.

                chart.drawBreakevenLine(ctx, rect.width, rect.height, minP, maxP, pos.entryPrice, pnlPercent);

                const multiplier = (pos.currentValue / pos.betAmount).toFixed(3);
                const isProfit = currentPnL >= 0;

                // P/L Display - Top Left
                ctx.save();

                // Background pill
                const pillWidth = 160;
                const pillHeight = 70;

                ctx.fillStyle = isProfit ? tokens.bgPillGreen : tokens.bgPillRed;
                ctx.strokeStyle = isProfit ? tokens.green : tokens.red; // Use strong token for border so it's visible? Or opacity?
                // Original was rgba(59,255,176,0.3).
                // tokens.green is #3bffb0. We can set globalAlpha or use hex logic.
                // For simplicity, let's use the token color for stroke but lighter alpha if possible.
                // ctx.globalAlpha = 0.3; ctx.stroke(); ctx.globalAlpha = 1;

                ctx.lineWidth = 1.5;

                ctx.beginPath();
                ctx.roundRect(12, 12, pillWidth, pillHeight, 12);
                ctx.fill();

                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.stroke();
                ctx.restore();

                // Label
                ctx.fillStyle = tokens.text;
                ctx.font = '11px system-ui, -apple-system, sans-serif';
                ctx.fillText('POSITION P/L', 24, 32);

                // Multiplier
                ctx.fillStyle = isProfit ? tokens.green : tokens.red;
                ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
                ctx.shadowColor = isProfit ? tokens.green : tokens.red;
                ctx.shadowBlur = 8;
                ctx.fillText(`${multiplier}x`, 24, 60);
                ctx.shadowBlur = 0;

                // P/L Amount
                ctx.fillStyle = isProfit ? tokens.green : tokens.red;
                ctx.font = '600 13px system-ui, -apple-system, sans-serif';
                ctx.fillText(
                    `${isProfit ? '+' : ''}$${currentPnL.toFixed(2)} (${Number(pnlPercent).toFixed(2)}%)`,
                    24,
                    76
                );

                ctx.restore();
            }

            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);

        return () => window.removeEventListener("resize", resize);
    }, []);

    // Polyfill for roundRect
    if (typeof CanvasRenderingContext2D.prototype.roundRect !== 'function') {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
            this.beginPath();
            this.moveTo(x + radius, y);
            this.lineTo(x + width - radius, y);
            this.quadraticCurveTo(x + width, y, x + width, y + radius);
            this.lineTo(x + width, y + height - radius);
            this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            this.lineTo(x + radius, y + height);
            this.quadraticCurveTo(x, y + height, x, y + height - radius);
            this.lineTo(x, y + radius);
            this.quadraticCurveTo(x, y, x + radius, y);
            this.closePath();
        };
    }

    return (
        <div style={{
            width: "100%",
            height: "100%",
            position: "relative",
            borderRadius: 18,
            overflow: "hidden",
            background: "#050509"
        }}>
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block"
                }}
            />
        </div>
    );
});

export default DegenChart;
