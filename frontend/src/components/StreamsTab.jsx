import React from 'react';
import StreamCard from './StreamCard';
import { getStreamDescription } from '../data/descriptions';
import { STREAMS } from '../data/GameData';

export default function StreamsTab({
    streams,
    managers,
    buyAmount,
    setBuyAmount,
    onBuyStream,
    onCollectStream,
    getStreamIcon
}) {
    // Create a sorted list for display (Cheapest -> Most Expensive)
    const SORTED_STREAMS = [...STREAMS].sort((a, b) => a.baseCost - b.baseCost);

    return (
        <>
            <div className="main-header" style={{ marginBottom: 24 }}>
                <div className="main-title">Streams</div>

                {/* Buy Amount Selector (Pill Group) */}
                <div className="pill-group">
                    {[1, 10, 25, 100, 'MAX'].map(amt => (
                        <button
                            key={amt}
                            className={buyAmount === amt ? "pill pill-gold" : "pill"}
                            onClick={() => setBuyAmount(amt)}
                            style={{ minWidth: 48, padding: '6px 12px' }} // Local override for smaller size
                        >
                            {amt}
                        </button>
                    ))}
                </div>
            </div>

            <div className="responsive-grid">
                {SORTED_STREAMS.map((s) => {
                    const key = s.id;
                    const stream = streams[key];
                    // If stream is missing from state (shouldn't happen with hydration fix), fallback to base
                    if (!stream) return null;

                    const desc = getStreamDescription(key);
                    return (
                        <StreamCard
                            key={key}
                            stream={{
                                id: key,
                                name: desc.name,
                                description: desc.description,
                                icon: getStreamIcon(key),
                                owned: stream.level,
                                baseCost: stream.baseCost,
                                baseYield: stream.baseYps,
                                baseTime: 3,
                                costScale: 1.15,
                                hasManager: managers[key],
                                unlocks: [],
                            }}
                            onBuy={() => onBuyStream(key)}
                            buyAmount={buyAmount}
                            onCollect={() => onCollectStream(key)}
                        />
                    );
                })}
            </div>
        </>
    );
}
