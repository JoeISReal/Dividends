import React from 'react';
import { useGame } from '../context/GameContext';
import { buyUpgrade } from '../services/api';
import { UpgradeCard } from '../components/UpgradeCard';

export function UpgradesPage() {
    const { gameState, setGameState } = useGame();

    if (!gameState) return <div>Loading...</div>;

    const { player, meta } = gameState;

    const handleBuy = async (upgradeId) => {
        const res = await buyUpgrade(upgradeId);
        if (res.success) {
            setGameState(prev => ({
                ...prev,
                player: res.player
            }));
        }
    };

    return (
        <div>
            {meta.upgrades.map(upgrade => {
                const canAfford = player.yield >= upgrade.cost;

                return (
                    <UpgradeCard
                        key={upgrade.id}
                        upgrade={upgrade}
                        canAfford={canAfford}
                        onBuy={() => handleBuy(upgrade.id)}
                    />
                );
            })}
        </div>
    );
}
