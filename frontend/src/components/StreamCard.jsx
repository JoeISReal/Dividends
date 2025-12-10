import React, { useState, useEffect, useRef } from "react";

export default function StreamCard({ stream, onBuy, buyAmount, onCollect }) {
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef(null);
    const startTimeRef = useRef(null);

    const isAutomated = stream.hasManager && stream.owned > 0;

    // Auto-produce animation (Visual Only)
    useEffect(() => {
        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // If not running, reset
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
                // Loop animation
                startTimeRef.current = Date.now();
                setProgress(0);
            }
        }, 50);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
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
                // Only manual clicks trigger checking logic IF needed, 
                // but for now we rely on simple click = 1 manual yield usually handled by parent?
                // Actually parent calls onCollect on completion. 
                // Manual collection is still allowed if valid.
                if (onCollect) {
                    onCollect(stream.id);
                }
                setProgress(0);
            }
        }, 50);
    };

    const cost = Math.floor(stream.baseCost * Math.pow(stream.costScale, stream.owned));

    let totalCost = 0;
    if (buyAmount === 'MAX') {
        totalCost = 999999999; // Placeholder logic as in original
    } else {
        // Simple accurate summation
        let currentCost = stream.baseCost * Math.pow(stream.costScale, stream.owned);
        for (let i = 0; i < buyAmount; i++) {
            totalCost += Math.floor(currentCost);
            currentCost *= stream.costScale;
        }
    }

    const yps = calculateYPS(stream);
    const nextUnlock = stream.unlocks && stream.unlocks.find(u => u.owned > stream.owned);

    return (
        <div className="stream-card" onClick={handleClick}>
            {/* Header with icon and title */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <div className="stream-icon">{stream.icon}</div>
                <div style={{ flex: 1 }}>
                    <div className="stream-title">
                        {stream.name}
                        {stream.hasManager && <span style={{ marginLeft: 6 }}>👔</span>}
                    </div>
                    {stream.description && (
                        <div style={{
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.5)',
                            marginTop: 2,
                            lineHeight: 1.3
                        }}>
                            {stream.description}
                        </div>
                    )}
                    <div className="stream-yield">${yps.toFixed(2)}/sec</div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#F4F4F8" }}>
                    {stream.owned}
                </div>
            </div>

            {/* Progress Bar */}
            {stream.owned > 0 && (
                <div style={{
                    width: "100%",
                    height: 4,
                    background: "#191A1F",
                    borderRadius: 2,
                    overflow: "hidden",
                    marginBottom: 12
                }}>
                    <div style={{
                        width: `${progress}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #3BFFB0, #2DE89A)",
                        transition: "width 0.05s linear"
                    }}></div>
                </div>
            )}

            {/* Stats */}
            <div className="stream-stats">
                <div className="stream-stat">⏱ {stream.baseTime}s</div>
                <div className="stream-stat">${cost.toLocaleString()} each</div>
            </div>

            {/* BUY Button */}
            <button
                className="btn-buy"
                onClick={(e) => { e.stopPropagation(); onBuy(stream.id, buyAmount); }}
            >
                BUY x{buyAmount === 'MAX' ? 'MAX' : buyAmount} • {buyAmount === 'MAX' ? 'MAX' : `$${totalCost.toLocaleString()}`}
            </button>
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
