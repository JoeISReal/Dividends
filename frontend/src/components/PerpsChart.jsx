import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { TradingEngine } from '../game/tradingEngine';

const PerpsChart = forwardRef(({ onPriceUpdate, activePosition }, ref) => {
    const canvasRef = useRef(null);
    const [price, setPrice] = useState(1.0);
    const [mousePos, setMousePos] = useState(null);
    const [hoverData, setHoverData] = useState(null);

    // Refs for callbacks
    const onPriceUpdateRef = useRef(onPriceUpdate);
    const activePositionRef = useRef(activePosition);

    useEffect(() => {
        onPriceUpdateRef.current = onPriceUpdate;
        activePositionRef.current = activePosition;
    }, [onPriceUpdate, activePosition]);

    // Trading engine and state - initialize immediately
    const engineRef = useRef(new TradingEngine());
    const stateRef = useRef({
        candles: [],
        currentCandle: null,
        chartOffset: 0,
        targetChartOffset: 0
    });

    // Expose applyTrade method to parent
    useImperativeHandle(ref, () => ({
        applyTrade: (amount, type) => {
            if (engineRef.current) {
                const newPrice = engineRef.current.applyTrade(amount, type);
                setPrice(newPrice);
                if (onPriceUpdateRef.current) {
                    onPriceUpdateRef.current(newPrice);
                }
            }
        }
    }), []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: true });

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        let animationFrameId;
        let candleInterval;

        const MAX_CANDLES = 150;
        const CANDLE_DURATION = 300; // SLOT GAME: Super fast candles!

        // Mouse handlers
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            setMousePos({ x, y });
        };

        const handleMouseLeave = () => {
            setMousePos(null);
            setHoverData(null);
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        // Candle creation interval
        candleInterval = setInterval(() => {
            const state = stateRef.current;
            const engine = engineRef.current;

            // Close current candle and start new one
            if (state.currentCandle) {
                state.candles.push(state.currentCandle);
                if (state.candles.length > MAX_CANDLES) state.candles.shift();
            }

            // Create new candle with current price
            state.currentCandle = engine.buildCandle(null, engine.price);
        }, CANDLE_DURATION);

        // Main render loop
        let lastTickTime = 0;
        const TICK_INTERVAL = 30; // SLOT GAME: 33 ticks/sec for smooth, fast action!

        const render = () => {
            const state = stateRef.current;
            const engine = engineRef.current;

            const now = performance.now();

            // Only tick price at controlled intervals
            if (now - lastTickTime >= TICK_INTERVAL) {
                engine.tickPrice();
                lastTickTime = now;
            }

            const currentPrice = engine.price;

            // Update current candle with latest price
            if (state.currentCandle) {
                state.currentCandle = engine.buildCandle(state.currentCandle, currentPrice);
            } else {
                state.currentCandle = engine.buildCandle(null, currentPrice);
            }

            // Update price state
            setPrice(currentPrice);
            if (onPriceUpdateRef.current) {
                onPriceUpdateRef.current(currentPrice);
            }

            // Camera movement (Rugs.fun style)
            const originX = canvas.width * 0.35;
            const allCandles = [...state.candles, state.currentCandle].filter(Boolean);
            const lastCandleX = originX + (allCandles.length * (canvas.width / MAX_CANDLES));

            if (lastCandleX < canvas.width * 0.6) {
                state.chartOffset = 0;
                state.targetChartOffset = 0;
            } else {
                const overflow = lastCandleX - (canvas.width * 0.85);
                if (overflow > 0) {
                    state.targetChartOffset = -overflow;
                }
            }

            state.chartOffset += (state.targetChartOffset - state.chartOffset) * 0.2;

            // Render
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            // Calculate scale
            const allHighs = allCandles.map(c => c.high);
            const allLows = allCandles.map(c => c.low);

            const minVal = 0;
            const maxVal = Math.max(...allHighs, 3.0);
            const range = maxVal - minVal;

            const yScale = (val) => height - ((val - minVal) / range) * height * 0.95 - height * 0.025;
            const candleWidth = width / MAX_CANDLES;

            const formatMoneyCanvas = (val) => {
                if (val === null || val === undefined || isNaN(val)) return "0.00";
                if (val >= 1e9) return (val / 1e9).toFixed(2) + 'B';
                if (val >= 1e6) return (val / 1e6).toFixed(2) + 'M';
                if (val >= 1e3) return (val / 1e3).toFixed(2) + 'K';
                return val.toFixed(3);
            };

            // Grid lines
            const gridSteps = 5;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
            ctx.lineWidth = 1;
            ctx.font = "10px monospace";
            ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
            ctx.textAlign = "right";

            for (let i = 0; i <= gridSteps; i++) {
                const val = minVal + (range * (i / gridSteps));
                const y = yScale(val);

                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();

                ctx.fillText(formatMoneyCanvas(val), width - 5, y - 5);
            }

            // 1.0x reference line
            const yCenterLine = yScale(1.0);
            ctx.strokeStyle = "rgba(255, 201, 85, 0.3)";
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            ctx.moveTo(0, yCenterLine);
            ctx.lineTo(width, yCenterLine);
            ctx.stroke();
            ctx.setLineDash([]);

            // Entry line
            const activePos = activePositionRef.current;
            if (activePos) {
                const entryPrice = activePos.entryPrice;
                const yEntry = yScale(entryPrice);

                let color = '#888';
                if (currentPrice > entryPrice) color = '#00FFA3';
                else if (currentPrice < entryPrice) color = '#FF4B47';

                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.shadowColor = color;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.moveTo(0, yEntry);
                ctx.lineTo(width, yEntry);
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.setLineDash([]);

                // Entry marker
                ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                ctx.fillRect(8, yEntry - 18, 90, 16);
                ctx.fillStyle = color;
                ctx.font = 'bold 11px "Segoe UI"';
                ctx.textAlign = "left";
                ctx.fillText(`Entry: ${formatMoneyCanvas(entryPrice)}`, 12, yEntry - 6);

                // Entry dot
                const currentX = originX + (allCandles.length - 1) * candleWidth + candleWidth / 2 + state.chartOffset;
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(currentX, yEntry, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // Draw candles
            allCandles.forEach((c, i) => {
                const rawX = originX + (i * candleWidth);
                const x = rawX + state.chartOffset;
                const yOpen = yScale(c.open);
                const yClose = yScale(c.close);
                const yHigh = yScale(c.high);
                const yLow = yScale(c.low);

                const isGreen = c.close >= c.open;
                const bodyColor = isGreen ? '#00FFA3' : '#FF4B47';
                const wickColor = isGreen ? '#00CC88' : '#D93636';

                // Shadow
                ctx.fillStyle = isGreen ? 'rgba(0, 255, 163, 0.1)' : 'rgba(255, 75, 71, 0.1)';
                const bodyHeight = Math.abs(yClose - yOpen);
                ctx.fillRect(x + candleWidth * 0.15, Math.min(yOpen, yClose) - 2, candleWidth * 0.7, bodyHeight + 4 || 1);

                // Wick
                ctx.strokeStyle = wickColor;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(x + candleWidth / 2, yHigh);
                ctx.lineTo(x + candleWidth / 2, yLow);
                ctx.stroke();

                // Body
                ctx.fillStyle = bodyColor;
                ctx.shadowColor = bodyColor;
                ctx.shadowBlur = 2;
                ctx.fillRect(x + candleWidth * 0.2, Math.min(yOpen, yClose), candleWidth * 0.6, bodyHeight || 1);
                ctx.shadowBlur = 0;
            });

            // Current price line
            const yCurrentPrice = yScale(currentPrice);
            ctx.strokeStyle = "rgba(0, 255, 163, 0.45)";
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.moveTo(0, yCurrentPrice);
            ctx.lineTo(width, yCurrentPrice);
            ctx.stroke();
            ctx.setLineDash([]);

            // Current price dot
            if (allCandles.length > 0) {
                const lastCandleIndex = allCandles.length - 1;
                const rawX = originX + (lastCandleIndex * candleWidth);
                const x = rawX + state.chartOffset;
                const currentX = x + candleWidth / 2;
                const currentY = yScale(currentPrice);
                ctx.fillStyle = '#FFD700';
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // Hover crosshair
            if (mousePos) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);

                ctx.beginPath();
                ctx.moveTo(mousePos.x, 0);
                ctx.lineTo(mousePos.x, height);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, mousePos.y);
                ctx.lineTo(width, mousePos.y);
                ctx.stroke();
                ctx.setLineDash([]);

                const hoveredIndex = Math.floor(mousePos.x / candleWidth);
                if (hoveredIndex >= 0 && hoveredIndex < allCandles.length) {
                    const candle = allCandles[hoveredIndex];
                    setHoverData({
                        index: hoveredIndex,
                        open: candle.open,
                        high: candle.high,
                        low: candle.low,
                        close: candle.close,
                        x: mousePos.x,
                        y: mousePos.y
                    });
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            clearInterval(candleInterval);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []); // Empty deps - only run once on mount

    const formatMoney = (val) => {
        if (val === null || val === undefined || isNaN(val)) return "0.0000";
        if (val >= 1e9) return (val / 1e9).toFixed(2) + 'B';
        if (val >= 1e6) return (val / 1e6).toFixed(2) + 'M';
        if (val >= 1e3) return (val / 1e3).toFixed(2) + 'K';
        return val.toFixed(4);
    };

    return (
        <div className="chart-wrapper" style={{ position: 'relative' }}>
            {/* Price Display */}
            <div style={{
                position: 'absolute',
                top: 16,
                left: 16,
                fontSize: '28px',
                fontWeight: '900',
                color: '#fff',
                textShadow: '0 0 10px rgba(255,255,255,0.5)',
                zIndex: 10
            }}>
                ${formatMoney(price)}
            </div>

            {/* Price Label Bubble - Top Right, Compact */}
            <div style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'linear-gradient(135deg, rgba(0, 255, 163, 0.15), rgba(0, 204, 136, 0.2))',
                border: '1px solid rgba(0, 255, 163, 0.3)',
                borderRadius: '12px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 'bold',
                color: '#00FFA3',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                zIndex: 10,
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(4px)'
            }}>
                {formatMoney(price)}x
            </div>

            {/* Hover Data Bubble */}
            {hoverData && (
                <div style={{
                    position: 'absolute',
                    left: Math.min(hoverData.x + 10, 600),
                    top: Math.max(hoverData.y - 80, 10),
                    background: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '11px',
                    color: '#fff',
                    zIndex: 15,
                    pointerEvents: 'none',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                }}>
                    <div style={{ marginBottom: 4, color: '#888' }}>Candle #{hoverData.index + 1}</div>
                    <div style={{ color: '#00FFA3' }}>O: {formatMoney(hoverData.open)}</div>
                    <div style={{ color: '#00FFA3' }}>H: {formatMoney(hoverData.high)}</div>
                    <div style={{ color: '#FF4B47' }}>L: {formatMoney(hoverData.low)}</div>
                    <div style={{ color: hoverData.close >= hoverData.open ? '#00FFA3' : '#FF4B47' }}>
                        C: {formatMoney(hoverData.close)}
                    </div>
                </div>
            )}

            <canvas
                ref={canvasRef}
                width={800}
                height={400}
                style={{
                    width: '100%',
                    height: '400px',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                }}
            />
        </div>
    );
});

export default PerpsChart;
