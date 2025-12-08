import React from 'react';
import { useGame } from '../context/GameContext';
import { prestige } from '../services/api';

export function PrestigePage() {
    const { gameState, setGameState } = useGame();

    if (!gameState) return <div>Loading...</div>;

    const { player } = gameState;

    const potentialMultiplier = player.lifetimeYield < 1000000
        ? 0
        : Math.sqrt(player.lifetimeYield / 1000000);

    const canPrestige = potentialMultiplier > player.prestige.multiplier;
    const gain = potentialMultiplier - player.prestige.multiplier;

    const handlePrestige = async () => {
        if (!window.confirm('⚠️ This will reset all streams and upgrades! Continue?')) return;

        const res = await prestige();
        if (res.success) {
            setGameState(prev => ({
                ...prev,
                player: res.player
            }));
            alert('✅ Prestige Successful!');
        } else {
            alert('❌ ' + res.reason);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="bg-[#1a1a1a] rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Shareholder Reset</h2>

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="text-center">
                        <div className="text-sm text-gray-400 mb-2">Current Multiplier</div>
                        <div className="text-4xl font-bold text-white">
                            x{player.prestige.multiplier.toFixed(2)}
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="text-sm text-gray-400 mb-2">Potential Multiplier</div>
                        <div className={`text-4xl font-bold ${canPrestige ? 'text-green-500' : 'text-gray-600'}`}>
                            x{potentialMultiplier.toFixed(2)}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handlePrestige}
                    disabled={!canPrestige}
                    className={`
            w-full py-4 rounded-lg font-bold text-lg transition-colors
            ${canPrestige
                            ? 'bg-red-600 hover:bg-red-500 text-white'
                            : 'bg-gray-800 text-gray-600 cursor-not-allowed'}
          `}
                >
                    {canPrestige
                        ? `Reset for +${gain.toFixed(2)}x Multiplier`
                        : 'Not Enough Progress'}
                </button>
            </div>
        </div>
    );
}
