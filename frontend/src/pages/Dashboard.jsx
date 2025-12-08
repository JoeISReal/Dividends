import React, { useState, useEffect } from 'react';
import { getPlayer, openCan } from '../services/api';
import { GameCard } from '../components/GameCard';
import { LootModal } from '../components/LootModal';

export function Dashboard() {
    const [player, setPlayer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loot, setLoot] = useState(null);

    const fetchPlayer = async () => {
        const data = await getPlayer();
        setPlayer(data);
    };

    useEffect(() => {
        fetchPlayer();
        const interval = setInterval(fetchPlayer, 1000); // Poll for passive income
        return () => clearInterval(interval);
    }, []);

    const handleOpenCan = async () => {
        setLoading(true);
        try {
            const res = await openCan();
            if (res.success) {
                setLoot(res.reward);
                setPlayer(res.player);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    if (!player) return <div className="text-center mt-20">Loading Empire...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center text-yellow-400">DIVIDENDS EMPIRE</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <GameCard title="Balance" className="text-center">
                    <div className="text-3xl font-bold text-green-400">
                        ${Math.floor(player.coins).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400 mt-2">Coins</div>
                </GameCard>

                <GameCard title="Stats" className="text-center">
                    <div className="text-xl">
                        Cans Opened: <span className="font-bold text-white">{player.stats.cansOpened}</span>
                    </div>
                    <div className="text-sm text-gray-400 mt-2">
                        Lifetime: ${Math.floor(player.stats.lifetimeEarnings).toLocaleString()}
                    </div>
                </GameCard>

                <GameCard title="Action" className="flex items-center justify-center">
                    <button
                        onClick={handleOpenCan}
                        disabled={loading}
                        className={`
              w-full h-full py-4 text-xl font-bold rounded-lg shadow-lg transition-all transform
              ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-500 hover:scale-105 active:scale-95'}
            `}
                    >
                        {loading ? 'Opening...' : 'OPEN CAN'}
                    </button>
                </GameCard>
            </div>

            <LootModal item={loot} onClose={() => setLoot(null)} />
        </div>
    );
}
