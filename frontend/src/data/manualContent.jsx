import React from 'react';

export const MANUAL_CHAPTERS = [
    {
        id: 'intro',
        title: '01. SYSTEM_OVERVIEW',
        label: 'Introduction',
        keywords: ['intro', 'guide', 'start', 'objective', 'yps', 'yield'],
        content: (
            <>
                <div className="manual-header">
                    <h1>SYSTEM_OVERVIEW</h1>
                    <span className="manual-subtitle">v1.0.0 // CLASSIFIED</span>
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
        keywords: ['income', 'money', 'yield', 'manager', 'automation', 'tier', 'investment'],
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
        keywords: ['gamble', 'bet', 'leverage', 'risk', 'rug', 'liquidation', 'chart', 'trading'],
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
        keywords: ['reset', 'multiplier', 'ascension', 'level', 'bonus', 'permanent'],
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
        keywords: ['chat', 'social', 'mission', 'raid', 'operator', 'intel'],
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
        keywords: ['rank', 'permission', 'admin', 'moderator', 'access'],
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
        keywords: ['words', 'definitions', 'terms', 'slang'],
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
    },
    {
        id: 'capital_recovery',
        title: '08. CAPITAL_RECOVERY',
        label: 'Rent Scanner',
        keywords: ['sol', 'rent', 'reclaim', 'scanner', 'waste', 'accounts', 'close'],
        content: (
            <>
                <div className="manual-header">
                    <h1>CAPITAL_RECOVERY</h1>
                    <span className="manual-subtitle">AUDIT // RECLAIM</span>
                </div>
                <div className="manual-body">
                    <p>
                        The Solana network charges "rent" for storing data on-chain. When token accounts are emptied or abandoned, this SOL remains locked.
                    </p>
                    <p>
                        The <strong>Rent Scanner</strong> identifies these dormant accounts and provides a mechanism to close them, reclaiming the locked SOL directly to your wallet.
                    </p>

                    <h3>SCAN PROTOOCOL</h3>
                    <ul className="manual-list">
                        <li>
                            <span className="mono">[SCAN]</span> Analyzes your wallet for empty Token and Token-2022 accounts.
                        </li>
                        <li>
                            <span className="mono">[IDENTIFY]</span> Highlights total reclaimable value (approx. ~0.002 SOL per account).
                        </li>
                        <li>
                            <span className="mono">[EXECUTE]</span> Batch closes accounts to recover liquidity.
                        </li>
                    </ul>

                    <div className="manual-alert">
                        <strong>💡 TIP:</strong>
                        <p>Closing a 0-balance account is safe. It simply removes the empty storage slot. If you receive that token again, a new account will be created automatically (funded by the sender).</p>
                    </div>
                </div>
            </>
        )
    },
    {
        id: 'inventory',
        title: '09. INVENTORY_LOOT',
        label: 'Inventory & Loot',
        keywords: ['items', 'gear', 'buffs', 'crates', 'keys', 'equipment'],
        content: (
            <>
                <div className="manual-header">
                    <h1>INVENTORY_LOOT</h1>
                    <span className="manual-subtitle">ASSETS // MODIFIERS</span>
                </div>
                <div className="manual-body">
                    <p>
                        Operators can acquire digital assets that provide passive buffs or active abilities.
                    </p>

                    <h3>LOOT CRATES</h3>
                    <p>
                        Crates are awarded for milestone achievements or purchased in the store. They require a <strong>Decryption Key</strong> to open.
                    </p>

                    <h3>ITEM RARITY</h3>
                    <div className="manual-table">
                        <div className="row header">
                            <span>RARITY</span>
                            <span>COLOR</span>
                            <span>EFFECT</span>
                        </div>
                        <div className="row">
                            <span className="mono">COMMON</span>
                            <span style={{ color: '#9ca3af' }}>GRAY</span>
                            <span>Minor Stat Boosts</span>
                        </div>
                        <div className="row">
                            <span className="mono">UNCOMMON</span>
                            <span style={{ color: '#10b981' }}>GREEN</span>
                            <span>Moderate Boosts</span>
                        </div>
                        <div className="row">
                            <span className="mono">RARE</span>
                            <span style={{ color: '#3b82f6' }}>BLUE</span>
                            <span>Significant Multipliers</span>
                        </div>
                        <div className="row">
                            <span className="mono">EPIC</span>
                            <span style={{ color: '#9333ea' }}>PURPLE</span>
                            <span>Major Power Spikes</span>
                        </div>
                        <div className="row">
                            <span className="mono">MYTHIC</span>
                            <span style={{ color: '#eab308' }}>GOLD</span>
                            <span className="med">Game-Changing Effects</span>
                        </div>
                    </div>
                </div>
            </>
        )
    },
    {
        id: 'system_awareness',
        title: '10. SYSTEM_AWARENESS',
        label: 'System Awareness',
        keywords: ['mood', 'status', 'events', 'feed', 'global', 'buffs', 'debuffs'],
        content: (
            <>
                <div className="manual-header">
                    <h1>SYSTEM_AWARENESS</h1>
                    <span className="manual-subtitle">ENVIRONMENT // CONDITIONS</span>
                </div>
                <div className="manual-body">
                    <p>
                        The DIVIDENDS system is not static. It reacts to global market conditions and operator behavior.
                    </p>

                    <h3>SYSTEM MOOD</h3>
                    <p>
                        The "Mood" has 4 intensity levels that affect yield/risk:
                    </p>
                    <ul className="manual-list">
                        <li><strong>QUIET:</strong> Low activity. Standard yields.</li>
                        <li><strong>ACTIVE:</strong> Normal operations. Balanced growth.</li>
                        <li><strong>HEATED:</strong> High volume. Increased yields, higher arena risk.</li>
                        <li><strong>EUPHORIC:</strong> Maximum volatility. Extreme yields, dangerous liquidation risk.</li>
                    </ul>

                    <h3>RISK PRESSURE</h3>
                    <p>
                        Monitors stability of the network:
                    </p>
                    <ul className="manual-list">
                        <li><strong style={{ color: 'var(--accent-green)' }}>LOW:</strong> System Stable.</li>
                        <li><strong style={{ color: 'var(--accent-orange)' }}>ELEVATED:</strong> Caution advised.</li>
                        <li><strong style={{ color: 'var(--accent-red)' }}>CRITICAL:</strong> Immediate threat.</li>
                    </ul>
                </div>
            </>
        )
    }
];
