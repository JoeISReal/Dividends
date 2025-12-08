import React, { useEffect, useState } from 'react';

export function LootModal({ item, onClose }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (item) {
            setVisible(true);
        }
    }, [item]);

    if (!item || !visible) return null;

    const rarityColors = {
        Common: 'text-gray-400',
        Uncommon: 'text-green-400',
        Rare: 'text-blue-400',
        Epic: 'text-purple-400',
        Mythic: 'text-yellow-400'
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-900 border-2 border-gray-600 p-8 rounded-xl max-w-sm w-full text-center transform transition-all scale-100">
                <h2 className="text-2xl font-bold mb-2 text-white">CAN OPENED!</h2>
                <div className="my-6">
                    <div className={`text-4xl font-bold mb-2 ${rarityColors[item.rarity] || 'text-white'}`}>
                        {item.name}
                    </div>
                    <div className={`text-sm uppercase tracking-wider ${rarityColors[item.rarity]}`}>
                        {item.rarity}
                    </div>
                    <div className="mt-2 text-gray-400">Value: {item.value} Coins</div>
                </div>
                <button
                    onClick={() => { setVisible(false); onClose(); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-colors"
                >
                    Collect
                </button>
            </div>
        </div>
    );
}
