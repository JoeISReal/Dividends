import React from 'react';
import { useGame } from '../context/GameContext';
import { buyUpgrade } from '../services/api';
import { GameCard } from '../components/GameCard';

export function UpgradesScreen() {
    const { gameState, setGameState } = useGame();

    if (!gameState) return <div>Loading...</div>;

    const { player, meta } = gameState;
    const availableUpgrades = meta.upgrades.filter(u => !u.owned);

    const handleBuy = async (upgradeId) => {
        const res = await buyUpgrade(upgradeId);
        if (res.success) {
            setGameState(prev => ({
                ...prev,
                player: res.player,
                meta: {
                    ...prev.meta,
                    upgrades: prev.meta.upgrades.map(u =>
                        u.id === upgradeId ? { ...u, owned: true } : u
                    )
                }
            }));
        }
    };

    return (
        <div className="p-4 max-w-4xl mx-auto pb-20">
            <h2 className="text-2xl font-bold mb-6 text-white">Tech Upgrades</h2>

            {availableUpgrades.length === 0 && (
                <div className="text-center text-gray-500 py-10">
                    All upgrades purchased! You are a whale.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableUpgrades.map(upgrade => {
                    const canAfford = player.yield >= upgrade.cost;

                    return (
                        <GameCard key={upgrade.id} className="border-l-4 border-blue-500">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-white">{upgrade.name}</h3>
                                <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded uppercase">
                                    {upgrade.type}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 mb-4">{upgrade.description}</p>

                            <button
                                onClick={() => handleBuy(upgrade.id)}
                                disabled={!canAfford}
                                className={`
                  w-full py-2 rounded font-bold transition-colors
                  ${canAfford
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'}
                `}
                            >
                                Buy ${upgrade.cost.toLocaleString()}
                            </button>
                        </GameCard>
                    );
                })}
            </div>
        </div>
    );
}
