import React from "react";

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
        <div className="upgrade-card">
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                <div className="stream-icon">{getIcon()}</div>
                <div style={{ flex: 1 }}>
                    <div className="stream-title">{upgrade.name}</div>
                    <div style={{ fontSize: 13, color: "#A5A9BC", marginTop: 4 }}>
                        {upgrade.desc}
                    </div>
                </div>
                {ownedLevel > 0 && (
                    <div style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#3BFFB0",
                        padding: "4px 10px",
                        background: "rgba(59, 255, 176, 0.1)",
                        borderRadius: 8,
                        border: "1px solid rgba(59, 255, 176, 0.25)"
                    }}>
                        {ownedLevel}
                    </div>
                )}
            </div>

            <button
                className="btn-buy"
                onClick={() => onBuy(upgrade.key)}
            >
                BUY • ${currentCost.toLocaleString()}
            </button>
        </div>
    );
}
