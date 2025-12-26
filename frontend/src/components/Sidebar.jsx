import React from 'react';
import { useGame } from '../context/GameContext';
import { EcosystemMoodPanel } from './EcosystemMoodPanel';

export function Sidebar({ currentPage, onNavigate }) {
    const { gameState } = useGame();

    if (!gameState) return null;

    const { player, meta } = gameState;

    return (
        <div className="sidebar surface-hud" style={{ padding: 'var(--space-5)' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: '20px', color: 'var(--text-primary)' }}>Dividends Simulator</h1>

            <div style={{ marginBottom: '30px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '5px 0' }}>Yield Per Second</p>
                <h2 style={{ fontSize: 'var(--text-2xl)', margin: '5px 0', color: 'var(--text-primary)' }}>
                    {Math.floor(meta.yieldPerSecond).toFixed(2)}
                </h2>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '5px 0' }}>Current Yield</p>
                <h2 style={{ fontSize: 'var(--text-xl)', margin: '5px 0', color: 'var(--accent-green)' }}>
                    ${Math.floor(player.yield).toLocaleString()}
                </h2>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '5px 0' }}>Multiplier</p>
                <h2 style={{ fontSize: 'var(--text-xl)', margin: '5px 0', color: 'var(--accent-gold)' }}>
                    x{player.prestige.multiplier.toFixed(2)}
                </h2>
            </div>

            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {['streams', 'upgrades', 'prestige', 'stats'].map(page => (
                    <a
                        key={page}
                        className={`nav-link ${currentPage === page ? 'active' : ''}`}
                        onClick={() => onNavigate(page)}
                        style={{
                            padding: 'var(--space-2) var(--space-3)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            color: currentPage === page ? 'var(--text-primary)' : 'var(--text-secondary)',
                            background: currentPage === page ? 'var(--bg-panel-soft)' : 'transparent',
                            transition: 'all var(--motion-fast)'
                        }}
                    >
                        {{
                            streams: '📊 Streams',
                            upgrades: '⚡ Upgrades',
                            prestige: '👑 Prestige',
                            stats: '📈 Stats'
                        }[page]}
                    </a>
                ))}
            </div>

            <EcosystemMoodPanel />
        </div>
    );
}
