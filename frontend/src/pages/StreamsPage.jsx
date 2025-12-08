import React from 'react';
import { useGame } from '../context/GameContext';
import { buyStream } from '../services/api';
import { StreamCard } from '../components/StreamCard';

export function StreamsPage() {
    const { gameState, setGameState } = useGame();

    if (!gameState) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
    }

    const { player, meta } = gameState;

    const handleBuy = async (streamId) => {
        const res = await buyStream(streamId);
        if (res.success) {
            setGameState(prev => ({
                ...prev,
                player: res.player
            }));
        }
    };

    return (
        <div>
            {meta.streams.map(stream => {
                const owned = player.streams[stream.id] || 0;
                const canAfford = player.yield >= stream.currentCost;

                return (
                    <StreamCard
                        key={stream.id}
                        stream={stream}
                        owned={owned}
                        canAfford={canAfford}
                        onBuy={() => handleBuy(stream.id)}
                    />
                );
            })}
        </div>
    );
}
