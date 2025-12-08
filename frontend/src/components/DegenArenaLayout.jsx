import React from 'react';
import '../styles/degen-theme.css';

export default function DegenArenaLayout({ chart, betPanel, liveDegens, balance, yps }) {
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
                    <div className="da-label">Balance</div>
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
                    <button className="btn-primary da-prestige-btn">Prestige</button>
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
                    </div>

                    {/* Chart container */}
                    <div className="da-chart-area">
                        {chart}
                    </div>
                </section>

                {/* Bottom bet panel */}
                <section className="card da-bet-shell">
                    {betPanel}
                </section>
            </main>

            {/* Right: Live Degens */}
            <aside className="da-right">
                <section className="card da-live-card">
                    <div className="da-section-title">Live Degens</div>
                    {liveDegens}
                </section>
            </aside>
        </div>
    );
}
