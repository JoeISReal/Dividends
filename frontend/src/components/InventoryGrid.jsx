import React from 'react';

export function InventoryGrid({ items }) {
    if (!items || items.length === 0) {
        return <div className="text-gray-500 italic">Inventory is empty...</div>;
    }

    const rarityColors = {
        Common: 'border-gray-600',
        Uncommon: 'border-green-600',
        Rare: 'border-blue-600',
        Epic: 'border-purple-600',
        Mythic: 'border-yellow-600'
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item, idx) => (
                <div
                    key={idx}
                    className={`p-3 rounded border ${rarityColors[item.rarity] || 'border-gray-600'} flex flex-col items-center text-center`}
                    style={{ backgroundColor: '#05070c' }}
                >
                    <span className="font-bold text-sm">{item.name}</span>
                    <span className="text-xs text-gray-400 mt-1">{item.rarity}</span>
                </div>
            ))}
        </div>
    );
}
