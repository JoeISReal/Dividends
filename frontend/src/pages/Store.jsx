import React, { useState, useEffect } from 'react';
import { getPlayer, getStore, buyUpgrade } from '../services/api';
import { GameCard } from '../components/GameCard';

export function Store() {
    const [player, setPlayer] = useState(null);
    const [store, setStore] = useState([]);
    const [msg, setMsg] = useState('');

    const fetchData = async () => {
        const [pData, sData] = await Promise.all([getPlayer(), getStore()]);
        setPlayer(pData);
        setStore(sData);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleBuy = async (id) => {
        const res = await buyUpgrade(id);
        if (res.success) {
            setPlayer(res.player);
            setMsg('Purchase Successful!');
            fetchData(); // Refresh costs
        } else {
            setMsg(`Failed: ${res.reason}`);
        }
        setTimeout(() => setMsg(''), 3000);
    };

    if (!player) return <div>Loading Store...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-white">Upgrade Store</h2>

            <div className="mb-4 text-right text-green-400 font-bold text-xl">
                Balance: ${Math.floor(player.coins).toLocaleString()}
            </div>

            {msg && <div className="mb-4 p-3 bg-blue-900 text-white rounded text-center">{msg}</div>}

            <div className="grid gap-4">
                {store.map(item => (
                    <GameCard key={item.id} className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold">{item.name}</h3>
                            <p className="text-gray-400">Owned: {item.owned}</p>
                            <p className="text-sm text-gray-500">Multiplier: x{item.multiplier}</p>
                        </div>
                        <button
                            onClick={() => handleBuy(item.id)}
                            disabled={player.coins < item.currentCost}
                            className={`
                px-6 py-2 rounded font-bold
                ${player.coins >= item.currentCost
                                    ? 'bg-green-600 hover:bg-green-500'
                                    : 'bg-gray-600 cursor-not-allowed opacity-50'}
              `}
                        >
                            Buy ${item.currentCost.toLocaleString()}
                        </button>
                    </GameCard>
                ))}
            </div>
        </div>
    );
}
