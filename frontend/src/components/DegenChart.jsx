import React, { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { TradingEngine } from '../game/tradingEngine';
import { ChartEngineV2 } from '../game/chartEngineV2';

const DegenChart = forwardRef(({ onPriceUpdate, activePosition }, ref) => {
    const canvasRef = useRef(null);
    const tradingRef = useRef(null);
    const chartRef = useRef(null);

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
        const trading = new TradingEngine();
        const chart = new ChartEngineV2(trading);

        tradingRef.current = trading;
        chartRef.current = chart;

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
                chart.drawBreakevenLine(ctx, rect.width, rect.height, minP, maxP, pos.entryPrice);

                const currentPnL = pos.currentValue - pos.betAmount;
                const pnlPercent = ((currentPnL / pos.betAmount) * 100).toFixed(2);
                const multiplier = (pos.currentValue / pos.betAmount).toFixed(3);
                const isProfit = currentPnL >= 0;

                // P/L Display - Top Left
                ctx.save();

                // Background pill
                const pillPadding = 16;
                const pillHeight = 70;
                const pillWidth = 160;

                ctx.fillStyle = isProfit
                    ? 'rgba(59,255,176,0.12)'
                    : 'rgba(255,75,106,0.12)';
                ctx.strokeStyle = isProfit
                    ? 'rgba(59,255,176,0.3)'
                    : 'rgba(255,75,106,0.3)';
                ctx.lineWidth = 1.5;

                ctx.beginPath();
                ctx.roundRect(12, 12, pillWidth, pillHeight, 12);
                ctx.fill();
                ctx.stroke();

                // Label
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = '11px system-ui, -apple-system, sans-serif';
                ctx.fillText('POSITION P/L', 24, 32);

                // Multiplier
                ctx.fillStyle = isProfit ? '#3bffb0' : '#ff6b81';
                ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
                ctx.shadowColor = isProfit ? 'rgba(59,255,176,0.4)' : 'rgba(255,75,106,0.4)';
                ctx.shadowBlur = 8;
                ctx.fillText(`${multiplier}x`, 24, 60);
                ctx.shadowBlur = 0;

                // P/L Amount
                ctx.fillStyle = isProfit ? '#3bffb0' : '#ff6b81';
                ctx.font = '600 13px system-ui, -apple-system, sans-serif';
                ctx.fillText(
                    `${isProfit ? '+' : ''}$${currentPnL.toFixed(2)} (${pnlPercent}%)`,
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
