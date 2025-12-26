import React, { useState } from 'react';
import ManagersTab from './ManagersTab';
import UpgradesTab from './UpgradesTab';

export default function OperationsTab({
    managers,
    ownedManagers,
    balance,
    onHireManager,
    upgrades,
    multipliers,
    onBuyUpgrade
}) {
    const [subTab, setSubTab] = useState('managers'); // 'managers' | 'upgrades'

    return (
        <div className="operations-tab">
            {/* Sub-tab Navigation (Segmented Control) */}
            {/* Sub-tab Navigation (Segmented Control) */}
            <div className="pill-group" style={{ marginBottom: 24, maxWidth: 400 }}>
                <button
                    onClick={() => setSubTab('managers')}
                    className={subTab === 'managers' ? 'pill pill-gold' : 'pill'}
                >
                    👔 MANAGERS
                </button>
                <button
                    onClick={() => setSubTab('upgrades')}
                    className={subTab === 'upgrades' ? 'pill pill-gold' : 'pill'}
                >
                    ⚡ UPGRADES
                </button>
            </div>

            {/* Content Area */}
            {subTab === 'managers' ? (
                <ManagersTab
                    managers={managers}
                    ownedManagers={ownedManagers}
                    balance={balance}
                    onBuy={onHireManager}
                />
            ) : (
                <UpgradesTab
                    upgrades={upgrades}
                    multipliers={multipliers}
                    onBuy={onBuyUpgrade}
                />
            )}
        </div>
    );
}
