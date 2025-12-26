import React, { useState, useEffect, useRef } from "react";
import { useGameStore } from "../state/gameStore";
import './StreamCard.css'; // Keeping for safety, though mostly refactored out

export default function StreamCard({ stream, onBuy, buyAmount, onCollect }) {
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef(null);
    const startTimeRef = useRef(null);

    const isAutomated = stream.hasManager && stream.owned > 0;

    // Auto-produce animation (Visual Only)
    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (!isAutomated) {
            setProgress(0);
            return;
        }

        const duration = stream.baseTime * 1000;
        startTimeRef.current = Date.now();

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const pct = Math.min(100, (elapsed / duration) * 100);
            setProgress(pct);

            if (pct >= 100) {
                startTimeRef.current = Date.now(); // Loop
                setProgress(0);
            }
        }, 50);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isAutomated, stream.baseTime]);

    // Manual click handler
    const handleClick = () => {
        if (stream.owned === 0) return;
        if (stream.hasManager) return;
        if (intervalRef.current) return;

        const duration = stream.baseTime * 1000;
        startTimeRef.current = Date.now();

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const pct = Math.min(100, (elapsed / duration) * 100);
            setProgress(pct);

            if (pct >= 100) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                if (onCollect) onCollect(stream.id);
                setProgress(0);
            }
        }, 50);
    };

    // Cost Calculation
    const cost = Math.floor(stream.baseCost * Math.pow(stream.costScale, stream.owned));
    let totalCost = 0;

    // Safety check for balance access
    const balance = useGameStore.getState().balance || 0;

    if (buyAmount === 'MAX') {
        // Simple MAX heuristic: buy as many as affordable
        // Actually, for display purposes we often just show 'MAX' if logic is complex
        // But let's keep it simple: 
        totalCost = 999999999;
        // Real logic usually happens in the store action, here we just need a number for display? 
        // The original code had a placeholder. We'll stick to 0 or placeholder if MAX.
    } else {
        let currentCost = stream.baseCost * Math.pow(stream.costScale, stream.owned);
        for (let i = 0; i < buyAmount; i++) {
            totalCost += Math.floor(currentCost);
            currentCost *= stream.costScale;
        }
    }

    const yps = calculateYPS(stream);

    // Dynamic Styling for Progress
    const progressStyle = {
        width: `${progress}%`,
        background: isAutomated ? 'var(--neon-green)' : 'var(--gold)',
        boxShadow: isAutomated ? 'var(--shadow-glow-neon)' : 'none',
        height: '100%',
        transition: isAutomated ? 'width 0.05s linear' : 'width 0.1s ease-out'
    };

    return (
        <div
            className={`card card-hover ${stream.owned > 0 ? 'card-active' : ''}`}
            onClick={handleClick}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                height: '100%'
            }}
        >
            {/* Background Hint for owned streams */}
            {stream.owned > 0 && (
                <div style={{
                    position: 'absolute', top: 0, right: 0, bottom: 0, width: '4px',
                    background: isAutomated ? 'var(--neon-green)' : 'var(--gold)',
                    opacity: 0.5
                }} />
            )}

            {/* Header Section */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                    minWidth: '48px', height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px'
                }}>
                    {stream.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="text-subtitle" style={{ fontSize: '16px' }}>
                            {stream.name}
                        </div>
                        <div className={`pill ${stream.owned > 0 ? 'pill-gold' : ''}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                            LVL {stream.owned}
                        </div>
                    </div>

                    <div className="text-neon" style={{ fontSize: '13px', marginTop: '2px' }}>
                        ${yps.toFixed(2)} / s
                    </div>
                </div>
            </div>

            {/* Progress Track */}
            <div style={{
                height: '6px',
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                borderRadius: '3px',
                overflow: 'hidden',
                marginTop: 'auto' // Push to bottom of flex container if height stretches
            }}>
                <div style={progressStyle} />
            </div>

            {/* Manager / Automation Status */}
            {stream.hasManager ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-med)' }}>
                    <span>👔 Manager Active</span>
                    <span style={{ color: 'var(--neon-green)' }}>●</span>
                </div>
            ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-low)' }}>
                    <span>Speed: {stream.baseTime}s</span>
                    <span>Manual Click</span>
                </div>
            )}

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                    className="btn-primary"
                    style={{
                        flex: 1,
                        fontSize: '12px',
                        padding: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        opacity: buyAmount !== 'MAX' && totalCost > balance ? 0.5 : 1
                    }}
                    onClick={(e) => { e.stopPropagation(); onBuy(stream.id, buyAmount); }}
                >
                    <span>BUY x{buyAmount}</span>
                    <span style={{ opacity: 0.8 }}>{buyAmount === 'MAX' ? 'MAX' : `$${totalCost.toLocaleString()}`}</span>
                </button>
            </div>
        </div>
    );
}

function calculateYPS(stream) {
    let mult = 1;
    if (stream.unlocks) {
        stream.unlocks.forEach(u => {
            if (stream.owned >= u.owned && u.type === 'profit') {
                mult *= u.multiplier;
            }
        });
    }
    return (stream.baseYield * stream.owned / stream.baseTime) * mult;
}
