import React from 'react';
import { useGame } from '../context/GameContext';

export function StatsPage() {
    const { gameState } = useGame();

    if (!gameState) return <div>Loading...</div>;

    const { player } = gameState;

    const totalStreams = Object.values(player.streams).reduce((a, b) => a + b, 0);
    const totalUpgrades = player.upgrades.length;
    const timePlayed = Math.floor((Date.now() - player.startTime) / 1000 / 60);

    const stats = [
        { label: 'Lifetime Yield', value: `$${Math.floor(player.lifetimeYield).toLocaleString()}` },
        { label: 'Current Yield', value: `$${Math.floor(player.yield).toLocaleString()}` },
        { label: 'Total Streams', value: totalStreams },
        { label: 'Total Upgrades', value: totalUpgrades },
        { label: 'Prestige Resets', value: player.prestige.resets },
        { label: 'Shareholder Multiplier', value: `x${player.prestige.multiplier.toFixed(2)}` },
        { label: 'Time Played', value: `${timePlayed} min` }
    ];

    return (
        <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        className="bg-[#1a1a1a] rounded-lg p-6"
                    >
                        <div className="text-sm text-gray-400 mb-2">{stat.label}</div>
                        <div className="text-3xl font-bold text-white">{stat.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
