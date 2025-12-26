import React, { useEffect, useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { TierBadge } from './TierBadge';
import { SystemStateStrip } from './SystemStateStrip';
import CapitalRecoveryPanel from './CapitalRecoveryPanel';
import { getNextTierProgress } from '../cosmetics/registry';
import { useSystemState } from '../hooks/useSystemState'; // Import hook

export default function DashboardTab() {
    const user = useGameStore(s => s.auth.user);
    const balance = useGameStore(s => s.balance);
    const lifetimeYield = useGameStore(s => s.lifetimeYield);
    const stats = useGameStore(s => s.stats);

    // Directive System State
    const { risk } = useSystemState();
    const isCritical = risk.status === 'CRITICAL';
    const isWarning = risk.status === 'ELEVATED'; // or check via label if mapped differently

    // Market Data State
    const [prices, setPrices] = useState(null);
    const [loadingMarket, setLoadingMarket] = useState(true);

    const tierProgress = getNextTierProgress(user?.holderBalanceApprox || 0);

    // Fetch Market Data
    useEffect(() => {
        const fetchMarket = async () => {
            try {
                const priceRes = await fetch('/api/market/prices');
                const priceData = await priceRes.json();
                setPrices(priceData);
                setLoadingMarket(false);
            } catch (e) {
                console.error("Market fetch failed", e);
                setLoadingMarket(false);
            }
        };
        fetchMarket();
        const interval = setInterval(fetchMarket, 60000);
        return () => clearInterval(interval);
    }, []);

    // Determine container classes/styles based on risk
    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        // Red Pulse for Critical
        animation: isCritical ? 'bg-pulse-red 2s infinite' : (isWarning ? 'border-pulse-amber 2s infinite' : 'none'),
        border: isCritical ? '1px solid var(--accent-red)' : (isWarning ? '1px solid var(--accent-orange)' : 'none'),
        borderRadius: 'var(--radius-lg)',
        padding: isCritical || isWarning ? 'var(--space-3)' : '0' // Add padding if border is shown
    };

    return (
        <div className="dashboard-tab" style={containerStyle}>

            {/* HERO SECTION: IDENTITY - Always Visible */}
            <div className="dash-hero surface-primary" style={{
                padding: 'var(--space-5)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6)',
                zIndex: 2,
                opacity: isCritical ? 0.7 : 1 // Dim slightly if critical? Or keep clear? "Dim non-essential". Identity is kinda essential?
            }}>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div className="text-label" style={{ marginBottom: 'var(--space-1)' }}>OPERATOR IDENTITY</div>
                            <h1 style={{ fontSize: 'var(--text-2xl)', margin: 0, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px', color: 'var(--text-primary)' }}>
                                {user?.displayName || (user?.handle ? `${user.handle.slice(0, 6)}...${user.handle.slice(-4)}` : 'Unknown')}
                            </h1>
                        </div>
                        <TierBadge balance={user?.holderBalanceApprox || 0} size="lg" />
                    </div>

                    <div style={{ display: 'flex', gap: '24px', marginTop: 'var(--space-3)' }}>
                        <div>
                            <div className="text-label">LEVEL</div>
                            <div className="text-value" style={{ fontSize: 'var(--text-xl)' }}>{user?.level || 1}</div>
                        </div>
                        <div>
                            <div className="text-label">LIFETIME EARNINGS</div>
                            <div className="text-value" style={{ fontSize: 'var(--text-xl)', color: 'var(--accent-green)' }}>${Math.floor(lifetimeYield).toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-label">NEXT TIER</div>
                            <div className="text-value" style={{ fontSize: 'var(--text-xl)' }}>{Math.floor(tierProgress.progress)}%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SYSTEM STATE STRIP - Always Active & Bright */}
            <SystemStateStrip className={isCritical ? 'pulse-critical' : ''} />

            {/* CAPITAL RECOVERY PANEL - Essential for fixing issues? Assuming yes. */}
            <CapitalRecoveryPanel />

            {/* MARKET & WALLET GRID - Non-Essential, Dim on Critical */}
            <div className="responsive-grid" style={{
                opacity: isCritical ? 0.3 : 1,
                pointerEvents: isCritical ? 'none' : 'auto',
                transition: 'opacity 0.3s ease'
            }}>

                {/* WALLET ASSETS */}
                <div className="surface-hud surface-subordinate" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 'var(--space-4)' }}>
                    <div className="panel-title text-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Wallet Assets</span>
                        <span style={{ fontSize: '10px', opacity: 0.5 }}>CONNECTED</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1, justifyContent: 'center' }}>
                        {(user?.holderBalanceApprox || 0) > 0 ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'auto 1fr auto',
                                gap: 'var(--space-3)',
                                alignItems: 'center',
                                padding: '16px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                {/* Icon */}
                                <div style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    background: '#000',
                                    border: '1px solid var(--border-muted)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                }}>
                                    <img src="/logo.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>

                                {/* Token Info */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>Dividends</div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: 'var(--accent-green)',
                                        fontWeight: 600,
                                        letterSpacing: '0.05em',
                                        background: 'rgba(62, 230, 160, 0.1)',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        alignSelf: 'flex-start'
                                    }}>DVD</div>
                                </div>

                                {/* Price & Balance */}
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                                        {prices?.dividends?.priceUsd
                                            ? `$${(parseFloat(prices.dividends.priceUsd) * (user?.holderBalanceApprox || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            : "---"}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                            {(user?.holderBalanceApprox || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} DVD
                                        </span>
                                        <span style={{ opacity: 0.7, marginLeft: '6px' }}>
                                            (@{prices?.dividends?.priceUsd ? parseFloat(prices.dividends.priceUsd).toFixed(6) : '0.00'})
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: 0.6, padding: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: 24 }}>🤔</div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                    No $DVD tokens found.<br />
                                    <a href="https://bags.fm/7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-green)', textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}>Buy on Bags</a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ARENA STATS - Non-Essential */}
            <div className="surface-hud surface-subordinate" style={{
                padding: 'var(--space-4)',
                opacity: isCritical ? 0.3 : 1,
                transition: 'opacity 0.3s ease'
            }}>
                <div className="panel-title text-label">Arena Performance</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)', textAlign: 'center' }}>
                    <div>
                        <div className="text-label">TRADES</div>
                        <div className="text-value" style={{ fontSize: 'var(--text-lg)' }}>
                            {(stats?.totalArenaTradesWon || 0) + (stats?.totalArenaTradesLost || 0)}
                        </div>
                    </div>
                    <div>
                        <div className="text-label">WIN RATE</div>
                        <div className="text-value" style={{ fontSize: 'var(--text-lg)' }}>
                            {((stats?.totalArenaTradesWon || 0) + (stats?.totalArenaTradesLost || 0)) > 0
                                ? `${Math.floor((stats?.totalArenaTradesWon / ((stats?.totalArenaTradesWon || 0) + (stats?.totalArenaTradesLost || 0))) * 100)}%`
                                : '--%'}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .panel-title {
                    font-size: var(--text-sm);
                    font-weight: 700;
                    margin-bottom: var(--space-3);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-secondary);
                }
                @keyframes bg-pulse-red {
                    0% { background-color: rgba(255, 0, 0, 0); box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
                    50% { background-color: rgba(255, 0, 0, 0.05); box-shadow: 0 0 20px 0 rgba(255, 0, 0, 0.1); }
                    100% { background-color: rgba(255, 0, 0, 0); box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
                }
                @keyframes border-pulse-amber {
                    0% { border-color: rgba(255, 165, 0, 0.3); }
                    50% { border-color: rgba(255, 165, 0, 0.8); }
                    100% { border-color: rgba(255, 165, 0, 0.3); }
                }
            `}</style>
        </div>
    );
}
