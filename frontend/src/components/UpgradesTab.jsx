import React from 'react';
import UpgradeCard from './UpgradeCard';
import { getUpgradeDescription } from '../data/descriptions';

export default function UpgradesTab({ upgrades, multipliers, onBuy }) {
    const clickDesc = getUpgradeDescription('click');
    const globalDesc = getUpgradeDescription('global');

    const upgradesCatalog = [
        {
            key: 'click',
            name: clickDesc.name,
            desc: clickDesc.description,
            cost: Math.floor(500 * Math.pow(2, upgrades.clickLevel)),
            level: upgrades.clickLevel,
            effect: `x${multipliers.click}`,
        },
        {
            key: 'global',
            name: globalDesc.name,
            desc: globalDesc.description,
            cost: Math.floor(50000 * Math.pow(1.5, upgrades.globalLevel)),
            level: upgrades.globalLevel,
            effect: `x${multipliers.global.toFixed(2)}`,
        },
    ];

    return (
        <div className="upgrades-tab">
            <div className="main-header" style={{ marginBottom: 20 }}>
                <div className="main-title">Upgrades</div>
                <div className="main-sub">Enhance your operational efficiency</div>
            </div>

            <div className="responsive-grid">
                {upgradesCatalog.map(u => (
                    <UpgradeCard
                        key={u.key}
                        upgrade={u}
                        onBuy={() => onBuy(u.key)}
                        ownedLevel={u.level}
                    />
                ))}
            </div>
        </div>
    );
}
