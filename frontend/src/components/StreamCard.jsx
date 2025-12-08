import React, { useState, useEffect, useRef } from "react";

export default function StreamCard({ stream, onBuy, buyAmount, onCollect }) {
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef(null);
    const startTimeRef = useRef(null);
    const onCollectRef = useRef(onCollect);

    // Keep onCollect ref updated without triggering re-renders
    useEffect(() => {
        onCollectRef.current = onCollect;
    }, [onCollect]);

    // Auto-produce if has manager
    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (!stream.hasManager || stream.owned === 0) {
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
                if (onCollectRef.current) {
                    onCollectRef.current(stream.id);
                }
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
    }, [stream.hasManager, stream.owned, stream.baseTime, stream.id]);

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
                if (onCollectRef.current) {
                    onCollectRef.current(stream.id);
                }
                setProgress(0);
            }
        }, 50);
    };

    const cost = Math.floor(stream.baseCost * Math.pow(stream.costScale, stream.owned));
    const totalCost = buyAmount === 'MAX'
        ? 999999999
        : Array.from({ length: buyAmount }, (_, i) =>
            Math.floor(stream.baseCost * Math.pow(stream.costScale, stream.owned + i))
        ).reduce((a, b) => a + b, 0);

    const yps = calculateYPS(stream);
    const nextUnlock = stream.unlocks.find(u => u.owned > stream.owned);

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
                BUY x{buyAmount === 'MAX' ? 'MAX' : buyAmount} • ${totalCost.toLocaleString()}
            </button>

            {/* Next Milestone */}
            {nextUnlock && (
                <div className="milestone-bar">
                    Next: {nextUnlock.owned} → {nextUnlock.type === 'profit' ? '💰' : '⚡'} ×{nextUnlock.multiplier}
                </div>
            )}
            {!nextUnlock && stream.owned > 0 && (
                <div className="milestone-bar" style={{ color: "#3BFFB0" }}>
                    ✓ Maxed!
                </div>
            )}
        </div>
    );
}

function calculateYPS(stream) {
    let mult = 1;
    stream.unlocks.forEach(u => {
        if (stream.owned >= u.owned && u.type === 'profit') {
            mult *= u.multiplier;
        }
    });
    return (stream.baseYield * stream.owned / stream.baseTime) * mult;
}
