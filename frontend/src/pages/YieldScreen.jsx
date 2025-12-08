import React from 'react';
import { useGame } from '../context/GameContext';
import { buyStream } from '../services/api';
import { GameCard } from '../components/GameCard';

export function YieldScreen() {
    const { gameState, setGameState } = useGame();

    if (!gameState) return <div className="p-10 text-center">Loading Market Data...</div>;

    const { player, meta } = gameState;

    const handleBuy = async (streamId) => {
        const res = await buyStream(streamId);
        if (res.success) {
            setGameState(prev => ({
                ...prev,
                player: res.player,
                meta: {
                    ...prev.meta,
                    // Optimistically update cost for UI responsiveness
                    streams: prev.meta.streams.map(s => {
                        if (s.id === streamId) {
                            return {
                                ...s,
                                currentCost: Math.floor(s.currentCost * s.costMultiplier)
                            };
                        }
                        return s;
                    })
                }
            }));
        }
    };

    return (
        <div className="p-4 max-w-4xl mx-auto pb-20">
            <div className="grid gap-4">
                {meta.streams.map(stream => {
                    const owned = player.streams[stream.id] || 0;
                    const canAfford = player.yield >= stream.currentCost;

                    return (
                        <GameCard key={stream.id} className="relative overflow-hidden group">
                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        {stream.name}
                                        <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">Lvl {owned}</span>
                                    </h3>
                                    <p className="text-sm text-gray-400">{stream.description}</p>
                                    <div className="text-xs text-green-400 mt-1">
                                        Yield: +{stream.baseYield * (owned || 1)} / sec
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleBuy(stream.id)}
                                    disabled={!canAfford}
                                    className={`
                    ml-4 px-6 py-3 rounded-lg font-bold min-w-[140px] transition-all
                    ${canAfford
                                            ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg hover:scale-105 active:scale-95'
                                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'}
                  `}
                                >
                                    <div className="text-xs uppercase opacity-75">Buy</div>
                                    <div>${stream.currentCost.toLocaleString()}</div>
                                </button>
                            </div>

                            {/* Progress Bar Visual (Optional polish) */}
                            <div className="absolute bottom-0 left-0 h-1 bg-green-500 opacity-20 w-full animate-pulse"></div>
                        </GameCard>
                    );
                })}
            </div>
        </div>
    );
}
