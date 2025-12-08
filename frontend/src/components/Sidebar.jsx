import React from 'react';
import { useGame } from '../context/GameContext';

export function Sidebar({ currentPage, onNavigate }) {
    const { gameState } = useGame();

    if (!gameState) return null;

    const { player, meta } = gameState;

    return (
        <div className="sidebar">
            <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Dividends Simulator</h1>

            <div style={{ marginBottom: '30px' }}>
                <p style={{ color: '#999', fontSize: '14px', margin: '5px 0' }}>Yield Per Second</p>
                <h2 style={{ fontSize: '32px', margin: '5px 0' }}>
                    {Math.floor(meta.yieldPerSecond).toFixed(2)}
                </h2>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <p style={{ color: '#999', fontSize: '14px', margin: '5px 0' }}>Current Yield</p>
                <h2 style={{ fontSize: '28px', margin: '5px 0' }}>
                    ${Math.floor(player.yield).toLocaleString()}
                </h2>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <p style={{ color: '#999', fontSize: '14px', margin: '5px 0' }}>Multiplier</p>
                <h2 style={{ fontSize: '24px', margin: '5px 0', color: '#ffa500' }}>
                    x{player.prestige.multiplier.toFixed(2)}
                </h2>
            </div>

            <div style={{ marginTop: '40px' }}>
                <a
                    className={`nav-link ${currentPage === 'streams' ? 'active' : ''}`}
                    onClick={() => onNavigate('streams')}
                >
                    📊 Streams
                </a>
                <a
                    className={`nav-link ${currentPage === 'upgrades' ? 'active' : ''}`}
                    onClick={() => onNavigate('upgrades')}
                >
                    ⚡ Upgrades
                </a>
                <a
                    className={`nav-link ${currentPage === 'prestige' ? 'active' : ''}`}
                    onClick={() => onNavigate('prestige')}
                >
                    👑 Prestige
                </a>
                <a
                    className={`nav-link ${currentPage === 'stats' ? 'active' : ''}`}
                    onClick={() => onNavigate('stats')}
                >
                    📈 Stats
                </a>
            </div>
        </div>
    );
}
