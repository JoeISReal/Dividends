import React from "react";
import './UpgradeCard.css';

export default function UpgradeCard({ upgrade, onBuy, ownedLevel }) {
    const currentCost = Math.floor(upgrade.cost * Math.pow(upgrade.costScale || 1.5, ownedLevel || 0));

    // Determine icon based on type/key if not provided
    const getIcon = () => {
        if (upgrade.key === 'click') return '👆';
        if (upgrade.key === 'global') return '🌐';
        // Fallbacks for legacy/potential future keys
        if (upgrade.key === 'faster_clicks') return '👆';
        if (upgrade.key === 'shitpost_boost') return '🚀';
        if (upgrade.key === 'global_mult') return '🌐';
        return '⚡';
    };

    return (
        <div
            className="card"
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                height: '100%',
                position: 'relative'
            }}
        >
            <div className="upgrade-header">
                <div className="upgrade-icon">{getIcon()}</div>
                <div className="upgrade-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="upgrade-name">{upgrade.name}</div>
                        {ownedLevel > 0 && (
                            <div className="pill pill-gold" style={{ fontSize: '11px', padding: '2px 8px' }}>
                                LVL {ownedLevel}
                            </div>
                        )}
                    </div>
                    <div className="upgrade-desc">
                        {upgrade.desc}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex' }}>
                <button
                    className="btn-primary"
                    style={{ flex: 1, display: 'flex', justifyContent: 'space-between', padding: '10px 16px', fontSize: '14px' }}
                    onClick={() => onBuy(upgrade.key)}
                >
                    <span>BUY</span>
                    <span style={{ opacity: 0.8 }}>${currentCost.toLocaleString()}</span>
                </button>
            </div>
        </div>
    );
}
