import React from 'react';
import { useGame } from '../context/GameContext';
import { prestige } from '../services/api';
import { GameCard } from '../components/GameCard';

export function PrestigeScreen() {
    const { gameState, setGameState } = useGame();

    if (!gameState) return <div>Loading...</div>;

    const { player } = gameState;

    // Calculate potential new multiplier
    // Formula from backend: sqrt(lifetime / 1,000,000)
    const potentialMultiplier = player.lifetimeYield < 1000000
        ? 0
        : Math.sqrt(player.lifetimeYield / 1000000);

    const canPrestige = potentialMultiplier > player.prestige.multiplier;

    const handlePrestige = async () => {
        if (!window.confirm('Are you sure? This will reset your streams and upgrades!')) return;

        const res = await prestige();
        if (res.success) {
            setGameState(prev => ({
                ...prev,
                player: res.player
            }));
            alert('Prestige Successful! Shareholder Value Increased.');
        } else {
            alert(res.reason);
        }
    };

    return (
        <div className="p-4 max-w-4xl mx-auto text-center pb-20">
            <h2 className="text-3xl font-bold mb-8 text-purple-400">Shareholder Meeting</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <GameCard title="Current Status">
                    <div className="text-4xl font-bold text-white mb-2">
                        x{player.prestige.multiplier}
                    </div>
                    <div className="text-gray-400">Current Multiplier</div>
                </GameCard>

                <GameCard title="Next Level">
                    <div className={`text-4xl font-bold mb-2 ${canPrestige ? 'text-green-400' : 'text-gray-600'}`}>
                        x{Math.floor(potentialMultiplier * 100) / 100}
                    </div>
                    <div className="text-gray-400">Potential Multiplier</div>
                </GameCard>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
                <p className="text-gray-300 mb-6 max-w-lg mx-auto">
                    Reset your empire to satisfy the board of directors. You will lose all streams and upgrades,
                    but gain a permanent global multiplier based on your lifetime earnings.
                </p>

                <div className="text-sm text-gray-500 mb-6">
                    Requirement: 1,000,000 Lifetime Yield
                </div>

                <button
                    onClick={handlePrestige}
                    disabled={!canPrestige}
                    className={`
            px-8 py-4 rounded-full font-bold text-xl transition-all
            ${canPrestige
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.5)] hover:scale-105'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'}
          `}
                >
                    TRIGGER RESET
                </button>
            </div>
        </div>
    );
}
