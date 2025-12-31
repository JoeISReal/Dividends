import React, { useState } from 'react';

const MANUAL_CHAPTERS = [
    {
        id: 'intro',
        title: '01. SYSTEM_OVERVIEW',
        label: 'Introduction',
        content: (
            <>
                <div className="manual-header">
                    <h1>SYSTEM_OVERVIEW</h1>
                    <span className="manual-subtitle">v0.9.1 // CLASSIFIED</span>
                </div>
                <div className="manual-body">
                    <p>
                        <strong>DIVIDENDS</strong> is a high-frequency capital accumulation simulator running on the Solana network.
                        Your objective is to maximize <strong>Yield Per Second (YPS)</strong> through strategic resource allocation
                        and automated infrastructure scaling.
                    </p>

                    <div className="manual-alert">
                        <strong>⚠️ DIRECTIVE:</strong>
                        <p>Accumulate capital. Climb the leaderboard. Dominate the network.</p>
                    </div>

                    <h3>CORE LOOPS</h3>
                    <ul className="manual-list">
                        <li>
                            <span className="mono">[INPUT]</span> <strong>Manual labor</strong> (Clicking) generates initial seed capital.
                        </li>
                        <li>
                            <span className="mono">[PROCESS]</span> <strong>Invest</strong> capital into revenue streams (Microbags, liquidity pools, validator nodes).
                        </li>
                        <li>
                            <span className="mono">[SCALE]</span> <strong>Automate</strong> streams via Managers to generate passive YPS.
                        </li>
                        <li>
                            <span className="mono">[OPTIMIZE]</span> <strong>Prestige</strong> to reset for permanent global multipliers.
                        </li>
                    </ul>
                </div>
            </>
        )
    },
    {
        id: 'streams',
        title: '02. REVENUE_STREAMS',
        label: 'Streams & Automation',
        content: (
            <>
                <div className="manual-header">
                    <h1>REVENUE_STREAMS</h1>
                    <span className="manual-subtitle">INFRASTRUCTURE // AUTOMATION</span>
                </div>
                <div className="manual-body">
                    <p>
                        Streams are the primary engines of your economy. Each stream type has a unique cost basis and yield potential.
                    </p>

                    <h3>TIER HIERARCHY</h3>
                    <div className="manual-table">
                        <div className="row header">
                            <span>CLASS</span>
                            <span>TYPE</span>
                            <span>RISK</span>
                        </div>
                        <div className="row">
                            <span className="mono">TIER I</span>
                            <span>Microbags</span>
                            <span className="low">LOW</span>
                        </div>
                        <div className="row">
                            <span className="mono">TIER II</span>
                            <span>Liquidity Pools</span>
                            <span className="med">MED</span>
                        </div>
                        <div className="row">
                            <span className="mono">TIER III</span>
                            <span>Validator Nodes</span>
                            <span className="high">HIGH</span>
                        </div>
                        <div className="row">
                            <span className="mono">TIER IV</span>
                            <span>Central Banking</span>
                            <span className="crit">EXTREME</span>
                        </div>
                    </div>

                    <h3>AUTOMATION PROTOCOLS</h3>
                    <p>
                        Manual collection is inefficient. Deploying <strong>Managers</strong> automates the collection process, ensuring 100% uptime for that stream tier.
                    </p>
                    <p className="mono text-muted">
                        &gt; MANAGER_STATUS: PERSISTENT<br />
                        &gt; REQUIREMENT: ONE-TIME FEE
                    </p>
                </div>
            </>
        )
    },
    {
        id: 'arena',
        title: '03. DEGEN_ARENA',
        label: 'Degen Arena',
        content: (
            <>
                <div className="manual-header">
                    <h1>DEGEN_ARENA</h1>
                    <span className="manual-subtitle">MARKET // VOLATILITY</span>
                </div>
                <div className="manual-body">
                    <p>
                        The Arena is a high-variance trading environment. Engage with caution.
                    </p>

                    <div className="manual-alert caution">
                        <strong>⚠️ WARNING: LIQUIDATION RISK</strong>
                        <p>Market stability is volatile. Zero stability triggers an immediate RUG event.</p>
                    </div>

                    <h3>MECHANICS</h3>
                    <ul className="manual-list">
                        <li>
                            <strong>Entry:</strong> Select leverage (1x - 50x). Higher leverage increases PnL velocity but accelerates liquidation risk.
                        </li>
                        <li>
                            <strong>Stability:</strong> A global market health metric. It fluctuates based on market conditions.
                        </li>
                        <li>
                            <strong>The Rug:</strong> If Stability hits <span className="mono">0.00%</span>, all active positions are liquidated.
                        </li>
                    </ul>

                    <h3>STRATEGY</h3>
                    <p>
                        Short-burst trading is recommended. Long-duration holds are susceptible to "Flash Crashes" and "Rug Pulls".
                    </p>
                </div>
            </>
        )
    },
    {
        id: 'prestige',
        title: '04. PRESTIGE_SYSTEM',
        label: 'Prestige & Ascension',
        content: (
            <>
                <div className="manual-header">
                    <h1>PRESTIGE_SYSTEM</h1>
                    <span className="manual-subtitle">RESET // AMPLIFY</span>
                </div>
                <div className="manual-body">
                    <p>
                        When local optimization limits are reached, initiate a <strong>System Reset</strong> (Prestige).
                    </p>

                    <h3>PROTOCOL DETAILS</h3>
                    <ul className="manual-list">
                        <li>
                            <span className="mono">[TRIGGER]</span> Available after <span className="mono">$1,000,000</span> lifetime earnings.
                        </li>
                        <li>
                            <span className="mono">[COST]</span> Resets Cash, Streams, Managers, and Upgrades.
                        </li>
                        <li>
                            <span className="mono">[RETAIN]</span> Keeps Player Level, Achievements, and Lifetime Stats.
                        </li>
                        <li>
                            <span className="mono">[REWARD]</span> Applies a permanent global multiplier to ALL future yield.
                        </li>
                    </ul>

                    <div className="manual-code">
                        Multiplier = (LifetimeEarnings / 1,000,000) ^ 0.5
                    </div>
                </div>
            </>
        )
    },
    {
        id: 'community',
        title: '05. COMMUNITY_OPS',
        label: 'Community Operations',
        content: (
            <>
                <div className="manual-header">
                    <h1>COMMUNITY_OPS</h1>
                    <span className="manual-subtitle">COORDINATION // AUDIT</span>
                </div>
                <div className="manual-body">
                    <p>
                        The <strong>Community Operations</strong> module facilitates coordinated actions across the network.
                    </p>

                    <h3>OPERATOR CHANNEL</h3>
                    <p>
                        A rate-limited, audited communication frequency for active operators.
                    </p>
                    <ul className="manual-list">
                        <li><strong>Decay:</strong> Messages degrade over time. "Fresh" intel is prioritized.</li>
                        <li><strong>Rate Limits:</strong> Spam is blocked. Signal-to-noise ratio is enforced.</li>
                    </ul>

                    <h3>MISSION CONTROL</h3>
                    <p>
                        The nerve center for external operations (Raids).
                    </p>
                    <ul className="manual-list">
                        <li><strong>Directives:</strong> High-priority targets issued by Command.</li>
                        <li><strong>Objectives:</strong> Specific goals (Awareness, Liquidity, Voting).</li>
                        <li><strong>Reporting:</strong> Confirm mission execution to log metrics.</li>
                    </ul>
                </div>
            </>
        )
    },
    {
        id: 'roles',
        title: '06. OPERATOR_ROLES',
        label: 'Clearance Levels',
        content: (
            <>
                <div className="manual-header">
                    <h1>OPERATOR_ROLES</h1>
                    <span className="manual-subtitle">AUTHORITY // HIERARCHY</span>
                </div>
                <div className="manual-body">
                    <p>
                        Access to system functions is gated by Clearance Level.
                    </p>

                    <div className="manual-table">
                        <div className="row header">
                            <span>LEVEL</span>
                            <span>DESIGNATION</span>
                            <span>CLEARANCE</span>
                        </div>
                        <div className="row">
                            <span className="mono">L0</span>
                            <span>OPERATOR</span>
                            <span>Standard Access. Chat read/write. Mission participation.</span>
                        </div>
                        <div className="row">
                            <span className="mono">L1</span>
                            <span>MODERATOR</span>
                            <span className="med">Enforcement. Chat mute/shadow. Raid creation.</span>
                        </div>
                        <div className="row">
                            <span className="mono">L2</span>
                            <span>ADMIN / SYSTEM</span>
                            <span className="crit">Full Control. System Override. Global Ban.</span>
                        </div>
                    </div>
                </div>
            </>
        )
    },
    {
        id: 'glossary',
        title: '07. GLOSSARY',
        label: 'System Glossary',
        content: (
            <>
                <div className="manual-header">
                    <h1>GLOSSARY</h1>
                    <span className="manual-subtitle">TERMINOLOGY // DEFINITIONS</span>
                </div>
                <div className="manual-body">
                    <div className="manual-list">
                        <p><strong className="mono">YPS (Yield Per Second)</strong><br />The primary metric of success. Total cash flow generated by all acquired streams.</p>

                        <p><strong className="mono">RUG (Liquidation Event)</strong><br />A catastrophic market failure in the Degen Arena. Occurs when Stability hits 0%.</p>

                        <p><strong className="mono">ALPHA</strong><br />High-value information. Usually distributed via the Operator Channel.</p>

                        <p><strong className="mono">KOLS (Key Opinion Leaders)</strong><br />Influential entities that can sway market sentiment (Stability).</p>

                        <p><strong className="mono">DIAMOND HANDS</strong><br />Holding assets despite volatility. Rewarded via long-term multipliers.</p>
                    </div>
                </div>
            </>
        )
    }
];

export default function HelpTab() {
    const [activeChapter, setActiveChapter] = useState(MANUAL_CHAPTERS[0].id);

    const activeContent = MANUAL_CHAPTERS.find(c => c.id === activeChapter) || MANUAL_CHAPTERS[0];

    return (
        <div className="manual-container">
            {/* SIDEBAR NAVIGATION */}
            <div className="manual-sidebar">
                <div className="manual-sidebar-header">
                    <span className="mono">SYS_MANUAL_V1</span>
                </div>
                <div className="manual-nav">
                    {MANUAL_CHAPTERS.map(chapter => (
                        <button
                            key={chapter.id}
                            className={`manual-nav-item ${activeChapter === chapter.id ? 'active' : ''}`}
                            onClick={() => setActiveChapter(chapter.id)}
                        >
                            <span className="chapter-id mono">{chapter.title.split('.')[0]}</span>
                            <span className="chapter-label">{chapter.label}</span>
                        </button>
                    ))}
                </div>
                <div className="manual-sidebar-footer mono">
                    CLASSIFIED
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="manual-content">
                <div className="manual-paper">
                    {activeContent.content}
                </div>
            </div>

            <style>{`
                .manual-container {
                    display: grid;
                    grid-template-columns: 240px 1fr;
                    height: 100%;
                    gap: 24px;
                    font-family: 'Inter', sans-serif;
                    overflow: hidden;
                    max-width: 1200px;
                    margin: 0 auto;
                    width: 100%;
                }

                /* SIDEBAR */
                .manual-sidebar {
                    border-right: 1px solid var(--border-subtle);
                    display: flex;
                    flex-direction: column;
                    padding-right: 12px;
                }

                .manual-sidebar-header {
                    padding: 0 0 16px 0;
                    color: var(--text-muted);
                    font-size: 11px;
                    border-bottom: 1px solid var(--border-subtle);
                    margin-bottom: 12px;
                }

                .manual-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .manual-nav-item {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 10px 12px;
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 6px;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                    opacity: 0.6;
                }

                .manual-nav-item:hover {
                    opacity: 1;
                    background: rgba(255,255,255,0.03);
                }

                .manual-nav-item.active {
                    opacity: 1;
                    background: rgba(255,255,255,0.06);
                    border-color: var(--border-subtle);
                }

                .chapter-id {
                    font-size: 10px;
                    color: var(--accent-gold);
                    margin-bottom: 2px;
                }

                .chapter-label {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .manual-sidebar-footer {
                    margin-top: auto;
                    font-size: 10px;
                    color: var(--text-muted);
                    opacity: 0.3;
                    letter-spacing: 0.2em;
                }

                /* CONTENT */
                .manual-content {
                    overflow-y: auto;
                    padding-right: 12px;
                }

                .manual-paper {
                    animation: fadeIn 0.3s ease;
                }

                .manual-header {
                    margin-bottom: 32px;
                    border-bottom: 2px solid var(--border-subtle);
                    padding-bottom: 16px;
                }

                .manual-header h1 {
                    font-family: 'SF Mono', monospace;
                    font-size: 24px;
                    margin: 0 0 8px 0;
                    letter-spacing: -0.02em;
                    color: var(--text-primary);
                }

                .manual-subtitle {
                    font-family: 'SF Mono', monospace;
                    font-size: 12px;
                    color: var(--accent-gold);
                }

                .manual-body {
                    color: var(--text-secondary);
                    line-height: 1.6;
                    font-size: 15px;
                }

                .manual-body h3 {
                    margin: 32px 0 16px 0;
                    font-size: 16px;
                    color: var(--text-primary);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-left: 3px solid var(--accent-gold);
                    padding-left: 12px;
                }

                .manual-alert {
                    background: rgba(255, 214, 113, 0.05);
                    border: 1px solid rgba(255, 214, 113, 0.2);
                    padding: 16px;
                    border-radius: 8px;
                    margin: 24px 0;
                }
                .manual-alert.caution {
                    background: rgba(239, 68, 68, 0.05);
                    border-color: rgba(239, 68, 68, 0.2);
                    color: #fca5a5;
                }

                .manual-list li {
                    margin-bottom: 12px;
                }

                .manual-code {
                    background: #000;
                    padding: 16px;
                    border-radius: 6px;
                    font-family: 'SF Mono', monospace;
                    font-size: 13px;
                    color: var(--accent-green);
                    border: 1px solid var(--border-subtle);
                    margin: 16px 0;
                }

                .manual-table {
                    display: flex;
                    flex-direction: column;
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    overflow: hidden;
                    margin: 16px 0;
                }

                .manual-table .row {
                    display: grid;
                    grid-template-columns: 1fr 2fr 1fr;
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border-subtle);
                    font-size: 13px;
                }
                .manual-table .row:last-child { border-bottom: none; }
                .manual-table .header {
                    background: rgba(255,255,255,0.05);
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .low { color: var(--accent-green); }
                .med { color: var(--accent-gold); }
                .high { color: var(--accent-orange); }
                .crit { color: var(--accent-red); }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Mobile responsive tweaks */
                @media (max-width: 768px) {
                    .manual-container {
                        grid-template-columns: 1fr;
                    }
                    .manual-sidebar {
                        border-right: none;
                        border-bottom: 1px solid var(--border-subtle);
                        padding-bottom: 16px;
                    }
                }
            `}</style>
        </div>
    );
}
