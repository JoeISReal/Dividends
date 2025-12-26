import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../game/GameContext';
import PerpsChart from './PerpsChart';

// Fake Leaderboard Data
const FAKE_PLAYERS = [
    { name: "TokenTurtle", icon: "🐢" },
    { name: "BagHolder69", icon: "🎒" },
    { name: "FrogFi", icon: "🐸" },
    { name: "MoonBoi", icon: "🚀" },
    { name: "RektCity", icon: "🏙️" },
    { name: "DiamondHands", icon: "💎" }
];

export default function PerpsTab() {
    const { state, actions } = useGame();
    const [currentPrice, setCurrentPrice] = useState(1.0);
    const [betAmount, setBetAmount] = useState(10);
    const [isRugged, setIsRugged] = useState(false);
    const [risk, setRisk] = useState(50); // 0-100
    const [sellPercent, setSellPercent] = useState(100);

    // Fake Leaderboard State
    const [leaderboard, setLeaderboard] = useState(
        FAKE_PLAYERS.map(p => ({ ...p, pnl: 0, isWin: true }))
    );

    // Update fake leaderboard periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setLeaderboard(prev => prev.map(p => {
                if (Math.random() > 0.7) { // Only update some players
                    const isWin = Math.random() > 0.5;
                    const change = Math.random() * 50;
                    return {
                        ...p,
                        pnl: isWin ? p.pnl + change : p.pnl - change,
                        isWin
                    };
                }
                return p;
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const activePos = state.perps?.activePosition;

    // Handle Price Updates
    const handlePriceUpdate = (price) => {
        setCurrentPrice(price);

        // Check Liquidation (Rug only)
        if (activePos && !isRugged) {
            // In Spot/1x, you only liquidate if price hits 0
            if (price <= 0) {
                actions.liquidatePosition();
            }
        }
    };

    const handleRug = () => {
        setIsRugged(true);
        if (activePos) {
            actions.liquidatePosition();
        }
        // Reset after 3s
        setTimeout(() => {
            setIsRugged(false);
        }, 3000);
    };

    const placeBet = () => {
        if (state.balance < betAmount) {
            actions.flashError("Not enough funds!");
            return;
        }
        // Prevent betting if price is 0 (during rug transition)
        if (currentPrice <= 0) {
            actions.flashError("Wait for price to reset!");
            return;
        }
        actions.openPosition({
            amount: betAmount,
            leverage: 1, // Spot Trading
            direction: 'long', // Always Buy
            entryPrice: currentPrice
        });
    };

    const closePosition = () => {
        if (!activePos) return;
        const entry = activePos.entryPrice;
        if (entry <= 0) return; // Safety check

        // PnL = (Current - Entry) / Entry * Amount
        const pnlPercent = (currentPrice - entry) / entry;

        // Calculate PnL for the PORTION being sold
        const fraction = sellPercent / 100;
        const amountToSell = activePos.amount * fraction;
        const rawPnL = amountToSell * pnlPercent; // 1x leverage

        actions.closePosition({ pnl: rawPnL, fraction });

        // Reset to 100% after a partial sell if position remains, or just default
        if (fraction < 1) setSellPercent(100);
    };

    // Calculate current PnL for display
    let currentPnL = 0;
    let pnlClass = '';
    if (activePos) {
        const entry = activePos.entryPrice;
        if (entry > 0) {
            const pnlPercent = (currentPrice - entry) / entry;
            currentPnL = activePos.amount * pnlPercent; // 1x leverage
        }
        pnlClass = currentPnL >= 0 ? 'win' : 'loss';
    }

    // Generate dummy history reel if empty
    const historyReel = useMemo(() => {
        const realHistory = state.perps?.history || [];
        if (realHistory.length >= 20) return realHistory;

        // Fill with dummy data
        const dummy = Array(20).fill(0).map((_, i) => ({
            result: Math.random() > 0.5 ? 'win' : 'loss',
            pnl: (Math.random() * 100).toFixed(2),
            leverage: 1 // Always 1x now
        }));
        return [...realHistory, ...dummy];
    }, [state.perps?.history]);

    // Helper to format large numbers
    const formatMoney = (val) => {
        if (val >= 1e9) return (val / 1e9).toFixed(2) + 'B';
        if (val >= 1e6) return (val / 1e6).toFixed(2) + 'M';
        if (val >= 1e3) return (val / 1e3).toFixed(2) + 'K';
        return val.toFixed(2);
    };

    return (
        <div className="perps-tab" style={{ padding: 'var(--space-4)' }}>
            {/* Header & Stats */}
            <div className="perps-header" style={{ marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 900 }}>🎰 Degen Arena</h2>
                <div className="perps-stats" style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    <span>Wins: {state.perps?.stats?.wins || 0}</span>
                    <span>Losses: {state.perps?.stats?.losses || 0}</span>
                </div>
            </div>

            {/* Last 100 Reel */}
            <div className="history-reel" style={{ display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 'var(--space-4)', padding: 4 }}>
                {historyReel.map((item, i) => (
                    <div key={i} className={`reel-card ${item.result}`} style={{
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: item.result === 'win' ? 'rgba(59, 255, 176, 0.1)' : 'rgba(255, 75, 106, 0.1)',
                        color: item.result === 'win' ? 'var(--accent-green)' : 'var(--accent-red)',
                        fontSize: '11px',
                        whiteSpace: 'nowrap'
                    }}>
                        {item.result === 'win' ? '🚀' : '🔻'} {item.pnl}%
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Main Chart Area */}
                <div className="surface-primary" style={{ flex: 3, position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', minHeight: '400px' }}>
                    <PerpsChart
                        onPriceUpdate={handlePriceUpdate}
                        onRug={handleRug}
                        activePosition={activePos}
                    />

                    {/* Floating PnL Bubble */}
                    {activePos && (
                        <div className={`pnl-bubble ${pnlClass}`} style={{
                            position: 'absolute',
                            top: 20,
                            left: 20,
                            padding: '8px 16px',
                            background: currentPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                            borderRadius: 'var(--radius-md)',
                            color: '#000',
                            fontWeight: 800,
                            display: 'flex',
                            gap: 8,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}>
                            <span>🚀 HODL</span>
                            <span>{currentPnL >= 0 ? '+' : ''}${formatMoney(currentPnL)}</span>
                        </div>
                    )}
                </div>

                {/* Fake Leaderboard */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <div className="leaderboard surface-secondary" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }}>
                        <h3 style={{ marginBottom: 'var(--space-3)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', textTransform: 'uppercase' }}>Live Degens</h3>
                        {leaderboard.map((p, i) => (
                            <div key={i} className="player-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 'var(--text-sm)' }}>
                                <div className="player-info" style={{ display: 'flex', gap: 8 }}>
                                    <span className="player-icon">{p.icon}</span>
                                    <span className="player-name" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                                </div>
                                <span className={`player-pnl ${p.pnl >= 0 ? 'green' : 'red'}`} style={{
                                    color: p.pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                                    fontWeight: 600
                                }}>
                                    {p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Combined Control Panel */}
            <div className={`bet-bar ${activePos ? pnlClass : ''}`} style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-4)',
                background: 'var(--bg-panel-soft)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                display: 'flex', flexDirection: 'column', gap: '16px'
            }}>

                {/* Active Position Stats (Header) */}
                {activePos && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingBottom: '16px',
                        borderBottom: '1px solid var(--border-subtle)',
                        width: '100%'
                    }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                                HELD: ${formatMoney(activePos.amount)}
                            </span>
                            <span style={{
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                color: currentPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
                            }}>
                                {currentPnL >= 0 ? '+' : ''}${formatMoney(currentPnL)}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span>Entry: <strong style={{ color: 'var(--text-primary)' }}>${formatMoney(activePos.entryPrice)}</strong></span>
                            <span>Value: <strong style={{ color: 'var(--text-primary)' }}>${formatMoney(activePos.amount + currentPnL)}</strong></span>
                        </div>
                    </div>
                )}

                {/* Betting Inputs Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                    {/* Amount */}
                    <div className="bet-input-group" style={{ maxWidth: '140px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '0.8rem' }}>AMOUNT</span>
                        <input
                            type="number"
                            className="bet-input"
                            value={betAmount}
                            onChange={(e) => setBetAmount(Number(e.target.value))}
                            style={{
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                padding: '8px',
                                borderRadius: 'var(--radius-sm)',
                                width: '100%'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                        {[
                            { label: '+1', val: b => b + 1 },
                            { label: '+10', val: b => b + 10 },
                            { label: 'x2', val: b => b * 2 },
                            { label: 'MAX', val: () => state.balance }
                        ].map((btn, i) => (
                            <button key={i} className="bet-pill" onClick={() => setBetAmount(btn.val)} style={{
                                padding: '8px 12px',
                                background: 'var(--bg-panel)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}>{btn.label}</button>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', width: '100%' }}>
                    {/* BUY Button - Always visible */}
                    <button
                        className="trade-btn long"
                        onClick={placeBet}
                        style={{
                            flex: activePos ? 1 : 2,
                            fontSize: '1.2rem',
                            textTransform: 'uppercase',
                            minWidth: '120px',
                            background: 'var(--accent-green)',
                            color: '#000',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            padding: '16px',
                            fontWeight: 900,
                            cursor: 'pointer'
                        }}
                    >
                        {activePos ? '🚀 BUY MORE' : '🚀 BUY'}
                    </button>

                    {/* SELL Section - Only when position active */}
                    {activePos && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {[25, 50, 75, 100].map(pct => (
                                    <button
                                        key={pct}
                                        onClick={() => setSellPercent(pct)}
                                        style={{
                                            flex: 1,
                                            padding: '4px',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            background: sellPercent === pct ? 'var(--accent-red)' : 'var(--bg-panel)',
                                            color: sellPercent === pct ? '#fff' : 'var(--text-secondary)',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {pct === 100 ? 'MAX' : `${pct}%`}
                                    </button>
                                ))}
                            </div>
                            <button
                                className="trade-btn short"
                                onClick={closePosition}
                                style={{
                                    width: '100%',
                                    fontSize: '1.2rem',
                                    textTransform: 'uppercase',
                                    background: 'var(--accent-red)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '12px',
                                    fontWeight: 900,
                                    cursor: 'pointer'
                                }}
                            >
                                💰 SELL {sellPercent < 100 ? `${sellPercent}%` : ''}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
