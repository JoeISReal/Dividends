import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../state/gameStore';
import { soundManager } from '../game/SoundManager';

import BetPanel from '../components/BetPanel';
import DegenChart from '../components/DegenChart';
import TradeHistoryList from '../components/TradeHistoryList';

export default function DegenArenaPage() {
    // Zustand store hooks
    const balance = useGameStore((s) => s.balance);
    const spend = useGameStore((s) => s.spend);
    const applyArenaResult = useGameStore((s) => s.applyArenaResult);
    const setArenaEntry = useGameStore((s) => s.setArenaEntry);
    const updateArenaStability = useGameStore((s) => s.updateArenaStability);
    const roundStability = useGameStore((s) => s.arena?.stability ?? 100);
    const tradeHistory = useGameStore((s) => s.tradeHistory);
    const showNotification = useGameStore((s) => s.showNotification);

    // XP State
    const xp = useGameStore(s => s.xp);
    const level = useGameStore(s => s.level);
    const xpToNext = useGameStore(s => s.xpToNext);

    const [activePosition, setActivePosition] = useState(null);
    const [currentPrice, setCurrentPrice] = useState(1.0);
    const chartRef = useRef(null);

    // Ref to track active position for the interval without re-running effect
    const activePositionRef = useRef(activePosition);
    const currentPriceRef = useRef(currentPrice);

    useEffect(() => {
        activePositionRef.current = activePosition;
    }, [activePosition]);

    useEffect(() => {
        currentPriceRef.current = currentPrice;
    }, [currentPrice]);


    // Stability Check Loop (Every 1s)
    useEffect(() => {
        const interval = setInterval(() => {
            if (!activePositionRef.current) return;

            const status = updateArenaStability(currentPriceRef.current);
            if (status === 'busted') {
                handleBust();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [updateArenaStability]);

    const handleBust = () => {
        const pos = activePositionRef.current;
        if (!pos) return;

        // Force sell at 0 value (Total Loss)
        applyArenaResult(-pos.betAmount, {
            betAmount: pos.betAmount,
            entryPrice: pos.entryPrice,
            exitPrice: 0,
            multiplier: 50 // Implied max leverage loss or whatever context
        });

        setActivePosition(null);
        if (chartRef.current) chartRef.current.applyTrade(0, 'sell'); // Visual only
        showNotification("📉 RUGGED! Market stability collapsed. You lost your position.", "bust");
        // Safe sound call
        if (soundManager.playError) soundManager.playError();
    };

    // Handle price updates from chart
    const handlePriceUpdate = (price) => {
        setCurrentPrice(price);

        // Update active position value
        if (activePosition) {
            const multiplier = price / activePosition.entryPrice;
            setActivePosition(prev => ({
                ...prev,
                currentValue: prev.betAmount * multiplier
            }));
        }
    };

    // Handle BUY action
    const handleBuy = (amount) => {
        if (soundManager.playClick) soundManager.playClick();

        // Use Zustand spend action - returns false if insufficient balance
        if (!spend(amount)) {
            showNotification('Insufficient balance!', 'error');
            if (soundManager.playError) soundManager.playError();
            return;
        }

        // Track arena entry (Reset stability)
        setArenaEntry(amount, currentPrice);

        // Apply trade to chart (affects price)
        if (chartRef.current) {
            chartRef.current.applyTrade(amount, 'buy');
        }

        if (activePosition) {
            // Add to existing position with weighted average entry price
            const totalAmount = activePosition.betAmount + amount;
            const weightedEntry = ((activePosition.betAmount * activePosition.entryPrice) + (amount * currentPrice)) / totalAmount;

            setActivePosition({
                betAmount: totalAmount,
                entryPrice: weightedEntry,
                currentValue: totalAmount * (currentPrice / weightedEntry)
            });
        } else {
            // Create new position
            setActivePosition({
                betAmount: amount,
                entryPrice: currentPrice,
                currentValue: amount
            });
        }
        if (soundManager.playSuccess) soundManager.playSuccess();
    };

    // Handle SELL action
    const handleSell = () => {
        if (soundManager.playClick) soundManager.playClick();
        if (!activePosition) return;

        // Calculate P/L
        const pnl = activePosition.currentValue - activePosition.betAmount;

        // Apply result to global balance via Zustand
        applyArenaResult(pnl, {
            betAmount: activePosition.betAmount,
            entryPrice: activePosition.entryPrice,
            exitPrice: currentPrice,
            multiplier: 1 // Spot trading effectively
        });

        // Clear position
        setActivePosition(null);

        // Apply sell pressure to chart
        if (chartRef.current) {
            chartRef.current.applyTrade(activePosition.currentValue, 'sell');
        }

        if (pnl > 0) {
            if (soundManager.playMoney) soundManager.playMoney();
        }
    };

    return (
        <div className="degen-arena-page" style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: 'var(--space-4)' }}>
            {/* Header / Stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-primary)' }}>
                        <span>🎰 DEGEN ARENA</span>
                    </div>

                    {/* XP BAR */}
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-subtle)',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)'
                    }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>Lvl {level}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>XP: {xp} / {xp + xpToNext}</span>
                        <div style={{
                            width: '60px',
                            height: '4px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '2px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${(xp / (xp + xpToNext)) * 100}%`,
                                height: '100%',
                                background: 'var(--accent-green)'
                            }} />
                        </div>
                    </div>
                </div>

                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Live: <span style={{ color: "var(--accent-green)", fontWeight: 600 }}>${(currentPrice || 0).toFixed(4)}</span>
                </div>
            </div>

            {/* MAIN GRIDS */}
            <div className="arena-grid">

                {/* LEFT COLUMN: CHART + HISTORY */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-4)',
                    height: '100%',
                    minHeight: 0
                }}>

                    {/* CHART AREA - Expandable */}
                    <div className="surface-primary" style={{
                        flex: '2 1 400px',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        position: 'relative',
                        minHeight: '400px',
                        padding: 0 /* Reset padding for canvas full fill */
                    }}>
                        <DegenChart
                            ref={chartRef}
                            onPriceUpdate={handlePriceUpdate}
                            activePosition={activePosition}
                        />

                        {/* Stability Meter Overlay */}
                        <div style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            padding: "6px 12px",
                            background: "rgba(0,0,0,0.6)",
                            backdropFilter: "blur(4px)",
                            color: roundStability > 50 ? "var(--accent-green)" : roundStability > 20 ? "var(--accent-gold)" : "var(--accent-red)",
                            borderRadius: 'var(--radius-md)',
                            fontSize: 14,
                            fontWeight: 700,
                            border: "1px solid rgba(255,255,255,0.1)",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                        }}>
                            <span>🛡️ Stability:</span>
                            <span>{Math.floor(Number(roundStability) || 100)}%</span>
                        </div>
                    </div>

                    {/* TRADE HISTORY - Fill remaining */}
                    <div className="surface-secondary" style={{
                        flex: '1 1 200px',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        padding: 0
                    }}>
                        <div style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border-subtle)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Recent Trades
                        </div>
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '12px',
                        }} className="custom-scrollbar">
                            <TradeHistoryList tradeHistory={tradeHistory} />
                        </div>
                    </div>

                </div>


                {/* RIGHT COLUMN: CONTROLS */}
                <div style={{ width: '100%' }}>
                    <BetPanel
                        onBuy={handleBuy}
                        onSell={handleSell}
                        activePosition={activePosition}
                        balance={balance}
                    />

                    {/* Instructions / Tips */}
                    <div style={{
                        marginTop: 16,
                        padding: 16,
                        background: 'var(--bg-panel-soft)',
                        borderRadius: 12,
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        border: '1px solid var(--border-subtle)'
                    }}>
                        <strong style={{ color: 'var(--text-primary)' }}>How to play:</strong>
                        <ul style={{ paddingLeft: 16, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <li>Watch the chart and stability meter.</li>
                            <li>Buy when you think it will pump.</li>
                            <li>Sell before a rug or bust (0% Stability).</li>
                            <li>Stability recovers on green candles and steady markets.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
