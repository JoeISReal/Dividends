import React, { useState, useRef } from 'react';
import { useGameStore } from '../state/gameStore';
import BetPanel from '../components/BetPanel';
import DegenChart from '../components/DegenChart';

export default function DegenArenaPage() {
    // Zustand store hooks
    const balance = useGameStore((s) => s.balance);
    const spend = useGameStore((s) => s.spend);
    const applyArenaResult = useGameStore((s) => s.applyArenaResult);
    const setArenaEntry = useGameStore((s) => s.setArenaEntry);

    const [activePosition, setActivePosition] = useState(null);
    const [currentPrice, setCurrentPrice] = useState(1.0);
    const chartRef = useRef(null);

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
        // Use Zustand spend action - returns false if insufficient balance
        if (!spend(amount)) {
            alert('Insufficient balance!');
            return;
        }

        // Track arena entry
        setArenaEntry(amount);

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
    };

    // Handle SELL action
    const handleSell = () => {
        if (!activePosition) return;

        // Apply trade to chart (affects price)
        if (chartRef.current) {
            chartRef.current.applyTrade(activePosition.betAmount, 'sell');
        }

        // Calculate P/L
        const pnl = activePosition.currentValue - activePosition.betAmount;

        // Apply result to global balance via Zustand
        applyArenaResult(pnl);

        // Clear position
        setActivePosition(null);
    };

    return (
        <>
            <div className="main-header">
                <div className="main-title">🎰 Degen Arena</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Live: <span style={{ color: "var(--accent-green)", fontWeight: 600 }}>${currentPrice.toFixed(4)}</span>
                </div>
            </div>

            {/* Optimized Layout: Chart on left, Controls on right */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 340px',
                gap: '16px',
                height: 'calc(100vh - 200px)',
                alignItems: 'start'
            }}>
                {/* Chart Card - Larger */}
                <div className="chart-card" style={{ height: '100%' }}>
                    <div className="chart-top-row">
                        <span>Price Chart</span>
                        <span className="pill pill--green">${currentPrice.toFixed(2)}</span>
                    </div>
                    <div className="chart-surface" style={{ height: 'calc(100% - 50px)' }}>
                        <DegenChart
                            ref={chartRef}
                            onPriceUpdate={handlePriceUpdate}
                            activePosition={activePosition}
                        />
                    </div>
                </div>

                {/* Trading Panel - Compact on right */}
                <div className="panel" style={{ position: 'sticky', top: '20px' }}>
                    <BetPanel
                        onBuy={handleBuy}
                        onSell={handleSell}
                        activePosition={activePosition}
                        balance={balance}
                    />
                </div>
            </div>
        </>
    );
}
