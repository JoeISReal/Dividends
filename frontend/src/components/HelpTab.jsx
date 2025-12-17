import React from 'react';

export default function HelpTab() {
    return (
        <div className="help-tab">
            <h2 className="main-title">📚 Game Guide</h2>

            {/* INTRO */}
            <div className="help-section">
                <h3>💰 The Basics</h3>
                <p><strong>Goal:</strong> Build the ultimate empire by generating cash and climbing the leaderboard.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                    <div className="stat-box">
                        <div className="label">YPS</div>
                        <div className="value">Yield Per Second</div>
                        <div className="sub">Automatic income from Streams</div>
                    </div>
                    <div className="stat-box">
                        <div className="label">Click Yield</div>
                        <div className="value">Farm Power</div>
                        <div className="sub">Cash earned per manual click</div>
                    </div>
                </div>
            </div>

            {/* STREAMS & MANAGERS */}
            <div className="help-section">
                <h3>📊 Streams & Managers</h3>
                <p><strong>Streams</strong> are your primary income sources. Purchase them to increase your YPS.</p>
                <ul>
                    <li><strong>Shitposting:</strong> Low cost, low yield. Good for starting.</li>
                    <li><strong>Sentiment Algo:</strong> High cost, massive yield. For the elites.</li>
                </ul>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 8, marginTop: 10 }}>
                    <strong>👔 Managers:</strong>
                    <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                        Streams normally require manual interaction. Hire a <strong>Manager</strong> to automate them so they produce cash 24/7, even when you're AFK!
                    </p>
                </div>
            </div>

            {/* BAGS / HOLDER TIERS */}
            <div className="help-section" style={{ borderColor: 'var(--accent-gold)' }}>
                <h3>💎 Holder Tiers (Bags Integration)</h3>
                <p>Hold the <strong>$DIVIDENDS</strong> token in your wallet to unlock exclusive status badges and multipliers.</p>
                <div className="tier-grid" style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                    <div className="tier-row" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 6 }}>
                        <span style={{ fontSize: 18 }}>🐋</span>
                        <div>
                            <strong style={{ color: '#00b4d8' }}>WHALE</strong>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Top 1% of Holders</div>
                        </div>
                    </div>
                    <div className="tier-row" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 6 }}>
                        <span style={{ fontSize: 18 }}>💪</span>
                        <div>
                            <strong style={{ color: '#76e176' }}>CHAD</strong>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Top 10% of Holders</div>
                        </div>
                    </div>
                    <div className="tier-row" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 6 }}>
                        <span style={{ fontSize: 18 }}>🦐</span>
                        <div>
                            <strong>TINY</strong>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Entry Level Holder</div>
                        </div>
                    </div>
                </div>
                <p style={{ fontSize: 12, marginTop: 10, fontStyle: 'italic', color: 'var(--text-muted)' }}>
                    *Snapshot is taken every few hours. Ranks are dynamic based on total supply distribution.
                </p>
            </div>

            {/* DEGEN ARENA */}
            <div className="help-section">
                <h3>🎰 Degen Arena</h3>
                <p>A high-risk trading simulator. Bet on the chart's movement!</p>

                <h4>How it Works:</h4>
                <ol style={{ paddingLeft: 20, color: 'var(--text-secondary)' }}>
                    <li><strong>Bet:</strong> Choose an amount to wager.</li>
                    <li><strong>Multiplier:</strong> 1x to 50x leverage. Higher leverage = faster gains/losses.</li>
                    <li><strong>Trade:</strong> "Enter" the market. </li>
                    <li><strong>Exit:</strong> Sell before you get wrecked!</li>
                </ol>

                <div style={{ marginTop: 12, borderLeft: '3px solid #ef4444', paddingLeft: 10 }}>
                    <h4 style={{ color: '#ef4444', margin: '0 0 5px' }}>⚠️ THE RUG METER</h4>
                    <p style={{ fontSize: 13 }}>
                        Watch the <strong>Stability</strong> meter. If it hits <strong>0%</strong>, the market RUGS.
                        Your trade is liquidated instantly. Stability drops when price crashes and recovers when price pumps.
                    </p>
                </div>
            </div>

            {/* PRESTIGE */}
            <div className="help-section">
                <h3>👑 Prestige</h3>
                <p>Reset your game progress to earn a <strong>Permanent Global Multiplier</strong>.</p>
                <ul>
                    <li><strong>Reset:</strong> Cash, Streams, Upgrades.</li>
                    <li><strong>Keep:</strong> Lifetime Yield Stats, Achievements.</li>
                    <li><strong>Gain:</strong> Multiplier based on your YPS at time of reset.</li>
                </ul>
            </div>

            {/* LEADERBOARD */}
            <div className="help-section">
                <h3>🏆 Leaderboard</h3>
                <p>Ranked by <strong>Lifetime Yield</strong> (Total cash ever generated).</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Shows the Top 50 players. Syncs automatically when you play.
                </p>
            </div>

        </div>
    );
}
