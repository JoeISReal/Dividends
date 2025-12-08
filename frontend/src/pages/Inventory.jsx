import React, { useState, useEffect } from 'react';
import { getPlayer } from '../services/api';
import { InventoryGrid } from '../components/InventoryGrid';

export function Inventory() {
    const [player, setPlayer] = useState(null);

    useEffect(() => {
        getPlayer().then(setPlayer);
    }, []);

    if (!player) return <div>Loading...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-white">Your Collection</h2>
            <InventoryGrid items={player.inventory} />
        </div>
    );
}
