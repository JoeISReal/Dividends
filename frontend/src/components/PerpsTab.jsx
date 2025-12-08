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
        <div className="perps-tab">
            {/* Header & Stats */}
            <div className="perps-header">
                <h2>🎰 Degen Arena</h2>
                <div className="perps-stats">
                    <span>Wins: {state.perps?.stats?.wins || 0}</span>
                    <span>Losses: {state.perps?.stats?.losses || 0}</span>
                </div>
            </div>

            {/* Last 100 Reel */}
            <div className="history-reel">
                {historyReel.map((item, i) => (
                    <div key={i} className={`reel-card ${item.result}`}>
                        {item.result === 'win' ? '🚀' : '🔻'} {item.pnl}%
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Main Chart Area */}
                <div style={{ flex: 3, position: 'relative' }}>
                    <PerpsChart
                        onPriceUpdate={handlePriceUpdate}
                        onRug={handleRug}
                        activePosition={activePos}
                    />

                    {/* Floating PnL Bubble */}
                    {activePos && (
                        <div className={`pnl-bubble ${pnlClass}`}>
                            <span>🚀 HODL</span>
                            <span>{currentPnL >= 0 ? '+' : ''}${formatMoney(currentPnL)}</span>
                        </div>
                    )}
                </div>

                {/* Fake Leaderboard */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <div className="leaderboard">
                        <h3>Live Degens</h3>
                        {leaderboard.map((p, i) => (
                            <div key={i} className="player-row">
                                <div className="player-info">
                                    <span className="player-icon">{p.icon}</span>
                                    <span className="player-name">{p.name}</span>
                                </div>
                                <span className={`player-pnl ${p.pnl >= 0 ? 'green' : 'red'}`}>
                                    {p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Combined Control Panel */}
            <div className={`bet-bar ${activePos ? pnlClass : ''}`} style={{ flexDirection: 'column', gap: '16px' }}>

                {/* Active Position Stats (Header) */}
                {activePos && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingBottom: '16px',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        width: '100%'
                    }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff' }}>
                                HELD: ${formatMoney(activePos.amount)}
                            </span>
                            <span style={{
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                color: currentPnL >= 0 ? '#00ffa8' : '#ff4d4d'
                            }}>
                                {currentPnL >= 0 ? '+' : ''}${formatMoney(currentPnL)}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: '#888' }}>
                            <span>Entry: <strong style={{ color: '#fff' }}>${formatMoney(activePos.entryPrice)}</strong></span>
                            <span>Value: <strong style={{ color: '#fff' }}>${formatMoney(activePos.amount + currentPnL)}</strong></span>
                        </div>
                    </div>
                )}

                {/* Betting Inputs Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                    {/* Amount */}
                    <div className="bet-input-group" style={{ maxWidth: '140px' }}>
                        <span style={{ color: '#888', fontWeight: 'bold', fontSize: '0.8rem' }}>AMOUNT</span>
                        <input
                            type="number"
                            className="bet-input"
                            value={betAmount}
                            onChange={(e) => setBetAmount(Number(e.target.value))}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="bet-pill" onClick={() => setBetAmount(b => b + 1)}>+1</button>
                        <button className="bet-pill" onClick={() => setBetAmount(b => b + 10)}>+10</button>
                        <button className="bet-pill" onClick={() => setBetAmount(b => b * 2)}>x2</button>
                        <button className="bet-pill" onClick={() => setBetAmount(state.balance)}>MAX</button>
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
                            minWidth: '120px'
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
                                            background: sellPercent === pct ? '#ff4d4d' : 'rgba(255,255,255,0.1)',
                                            color: sellPercent === pct ? '#fff' : '#888',
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
                                style={{ width: '100%', fontSize: '1.2rem', textTransform: 'uppercase' }}
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
