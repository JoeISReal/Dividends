import React from "react";

export default function ManagersTab({ managers, ownedManagers, balance, onBuy }) {
    return (
        <div className="managers-tab">
            <h2>Managers</h2>
            <p className="tab-desc">Hire managers to automate your streams</p>

            <div className="managers-grid">
                {managers.map(mgr => {
                    const owned = ownedManagers.includes(mgr.id);
                    const canAfford = balance >= mgr.cost;

                    return (
                        <div key={mgr.id} className={`manager-card ${owned ? 'owned' : ''}`}>
                            <div className="manager-header">
                                <div className="manager-icon">👔</div>
                                <div>
                                    <div className="manager-name">{mgr.name}</div>
                                    <div className="manager-stream">Automates: {mgr.streamId}</div>
                                </div>
                            </div>

                            {owned ? (
                                <div className="manager-owned">✓ HIRED</div>
                            ) : (
                                <button
                                    className={`manager-buy ${canAfford ? '' : 'disabled'}`}
                                    onClick={() => onBuy(mgr.id)}
                                    disabled={!canAfford}
                                >
                                    Hire ${mgr.cost.toLocaleString()}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
