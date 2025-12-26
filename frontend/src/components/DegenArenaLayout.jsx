
import React from 'react';
import '../styles/degen-theme.css';
import { TierBadge } from './TierBadge';
import { useGameStore } from '../state/gameStore';
import { MOOD_CONFIG } from '../cosmetics/registry';

export default function DegenArenaLayout({ chart, betPanel, liveDegens, balance, yps }) {
    const user = useGameStore(s => s.auth.user);
    const mood = useGameStore(s => s.marketStats?.mood) || 'QUIET';

    return (
        <div className="da-root">
            {/* Left Sidebar */}
            <aside className="da-sidebar">
                <div className="da-brand">
                    <div className="da-logo-circle">
                        <span>💸</span>
                    </div>
                    <div>
                        <div className="da-title">DIVIDENDS</div>
                        <div className="da-subtitle">Degen Arena</div>
                    </div>
                </div>

                <div className="da-balance-card card">
                    <div className="da-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Balance</span>
                        {user?.holderTier && user.holderTier !== 'NONE' && (
                            <TierBadge tier={user.holderTier} size="xs" showLabel={false} />
                        )}
                    </div>
                    <div className="da-balance">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="da-label mt-2">YPS</div>
                    <div className="da-yps">${yps.toFixed(2)} / sec</div>
                </div>

                <nav className="da-nav card">
                    <button className="da-nav-item">Streams</button>
                    <button className="da-nav-item">Managers</button>
                    <button className="da-nav-item">Upgrades</button>
                    <button className="da-nav-item da-nav-item--active">Degen Arena</button>
                </nav>

                <div className="da-prestige card">
                    <div className="da-label">Prestige Mult</div>
                    <div className="da-prestige-mult">x1.00</div>
                    <button className="btn-action-primary da-prestige-btn">Prestige</button>
                </div>
            </aside>

            {/* Center: Chart & multipliers */}
            <main className="da-main">
                <section className="card da-chart-shell">
                    {/* Top history multipliers / Last 100 */}
                    <div className="da-last100-row">
                        <div className="da-label">Last 100</div>
                        <div className="da-last100-badges">
                            <div className="da-badge da-badge--silver">2x 52</div>
                            <div className="da-badge da-badge--gold">10x 7</div>
                            <div className="da-badge da-badge--legend">50x 4</div>
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>Market Mood:</span>
                            <span style={{ fontWeight: 600, color: MOOD_CONFIG[mood]?.color || '#9ca3af' }}>{mood}</span>
                        </div>
                    </div>

                    {/* The Chart (Passed as prop to reuse Logic) */}
                    <div className="da-chart-container">
                        {chart}
                    </div>
                </section>

                <section className="card da-bet-panel">
                    {betPanel || <div className="da-placeholder">Betting Controls</div>}
                </section>
            </main>

            {/* Right: Live Feed / Players */}
            <aside className="da-feed">
                <div className="card h-full">
                    <div className="da-label mb-2">Live Degens</div>
                    <div className="da-feed-list">
                        {liveDegens || <div className="da-placeholder">Connecting...</div>}
                    </div>
                </div>
            </aside>
        </div>
    );
}
