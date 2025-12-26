import React from "react";
import './UpgradeCard.css';

export default function UpgradeCard({ upgrade, onBuy, ownedLevel }) {
    const currentCost = Math.floor(upgrade.cost * Math.pow(upgrade.costScale || 1.5, ownedLevel || 0));

    // Determine icon based on type/key if not provided
    const getIcon = () => {
        if (upgrade.key === 'faster_clicks') return '👆';
        if (upgrade.key === 'shitpost_boost') return '🚀';
        if (upgrade.key === 'global_mult') return '🌐';
        return '⚡';
    };

    return (
        <div className="upgrade-card surface-secondary">
            <div className="upgrade-header">
                <div className="upgrade-icon">{getIcon()}</div>
                <div className="upgrade-info">
                    <div className="upgrade-name">{upgrade.name}</div>
                    <div className="upgrade-desc">
                        {upgrade.desc}
                    </div>
                </div>
                {ownedLevel > 0 && (
                    <div className="upgrade-level">
                        {ownedLevel}
                    </div>
                )}
            </div>

            <button
                className="btn-action-primary"
                style={{ width: '100%' }}
                onClick={() => onBuy(upgrade.key)}
            >
                BUY • ${currentCost.toLocaleString()}
            </button>
        </div>
    );
}
