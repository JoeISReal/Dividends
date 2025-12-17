import React from "react";
import { useGameStore } from "./state/gameStore";
import { soundManager } from "./game/SoundManager";
import ConfirmationModal from "./components/ConfirmationModal";
import { TierBadge } from "./components/TierBadge";
import "./styles/dividends-theme.css";
import { MOOD_CONFIG } from './cosmetics/registry';

export function AppShell({ activeTab, onTabChange, centerContent, liveDegens }) {
    // Zustand store hooks
    const balance = useGameStore((s) => s.balance);
    const yps = useGameStore((s) => s.yps);
    const lifetimeYield = useGameStore((s) => s.lifetimeYield);
    const totalClicks = useGameStore((s) => s.totalClicks);
    const yieldPerClick = useGameStore((s) => s.yieldPerClick);
    const clickMultiplier = useGameStore((s) => s.multipliers.click);
    const prestigeMultiplier = useGameStore((s) => s.multipliers.prestige);
    const user = useGameStore((s) => s.auth.user);
    const marketStats = useGameStore((s) => s.marketStats);

    // Actions
    const registerClick = useGameStore((s) => s.registerClick);
    const doPrestige = useGameStore((s) => s.doPrestige);

    const handleMine = () => {
        soundManager.playClick();
        registerClick();
    };

    const effectiveClickYield = yieldPerClick * clickMultiplier;

    // Generic Modal State
    const [modalConfig, setModalConfig] = React.useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const handlePrestigeClick = () => {
        soundManager.playClick();
        setModalConfig({
            isOpen: true,
            title: 'Prestige Reset',
            message: 'Are you sure you want to prestige? This will reset all streams and upgrades in exchange for a permanent multiplier bonus based on your current YPS.',
            onConfirm: () => {
                const bonus = doPrestige();
                soundManager.playSuccess();
                useGameStore.getState().showNotification(`Prestige Successful! +${bonus}x Multiplier`, 'success');
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    return (
        <div className="app-shell bg-abstract-hero bg-overlay">
            {/* LEFT NAV */}
            <aside className="app-nav">
                <div className="app-logo">
                    <div className="app-logo-icon">
                        <img src="/logo.png" alt="Dividends" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                    </div>
                    <div>
                        <div className="app-logo-text">DIVIDENDS</div>
                        <div className="app-logo-sub">DEGEN WEALTH</div>
                    </div>
                </div>

                <div className="nav-card">
                    <div className="nav-item" style={{ cursor: "default" }}>
                        <div className="nav-item-icon">💰</div>
                        <div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Balance</div>
                            <div style={{ fontWeight: 600 }}>${balance.toFixed(2)}</div>
                        </div>
                    </div>
                    <div className="nav-item" style={{ cursor: "default", marginTop: 8 }}>
                        <div className="nav-item-icon">📈</div>
                        <div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>YPS</div>
                            <div style={{ fontWeight: 600, color: "var(--accent-green)" }}>
                                ${yps.toFixed(2)}/s
                            </div>
                        </div>
                    </div>
                </div>

                <div className="nav-card">
                    {[
                        { id: "streams", label: "Streams", icon: "📊" },
                        { id: "managers", label: "Managers", icon: "👔" },
                        { id: "upgrades", label: "Upgrades", icon: "⚡" },
                        { id: "degen-arena", label: "Degen Arena", icon: "🎰" },
                        { id: "leaderboard", label: "Leaderboard", icon: "🏆" },
                        { id: "community", label: "Community", icon: "🐦" },
                        { id: "settings", label: "Settings", icon: "⚙️" },
                        { id: "help", label: "Help", icon: "❓" },
                    ].map(item => (
                        <div
                            key={item.id}
                            className={
                                "nav-item" + (activeTab === item.id ? " nav-item--active" : "")
                            }
                            onClick={() => {
                                onTabChange(item.id);
                                soundManager.playClick();
                            }}
                        >
                            <div className="nav-item-icon">{item.icon}</div>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>

                <div className="nav-card">
                    <button className="btn-primary" style={{ width: "100%" }} onClick={handleMine}>
                        FARM (+{effectiveClickYield})
                    </button>
                </div>

                <div className="nav-card">
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                        PRESTIGE
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-gold)", marginBottom: 8 }}>
                        x{prestigeMultiplier.toFixed(2)}
                    </div>
                    <button
                        className="btn-primary"
                        style={{ width: "100%", fontSize: 13 }}
                        onClick={handlePrestigeClick}
                    >
                        Prestige
                    </button>
                </div>
            </aside>

            {/* CENTER MAIN */}
            <main className="app-main">
                {centerContent}
            </main>

            {/* RIGHT SIDEBAR */}
            <aside className="app-right">
                <div className="panel" style={{ marginBottom: 16 }}>
                    <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Ecosystem</span>
                        <button
                            onClick={(e) => {
                                e.currentTarget.style.opacity = 0.5;
                                fetchBagsStatus().then(() => e.currentTarget.style.opacity = 1);
                            }}
                            title="Force Refresh Data"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 14,
                                padding: 0
                            }}
                        >
                            🔄
                        </button>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        {marketStats?.stale && (
                            <div style={{
                                background: 'rgba(234, 179, 8, 0.15)',
                                color: '#eab308',
                                padding: '4px 8px',
                                borderRadius: 4,
                                marginBottom: 8,
                                fontSize: 11,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}>
                                <span>⚠️ Data Delayed</span>
                            </div>
                        )}
                        {/* Bags Status Error (Network) */}
                        {bagsStatusError && (
                            <div style={{ color: '#ef4444', marginBottom: 8, fontSize: 11 }}>
                                📡 Connection Issues
                            </div>
                        )}

                        {user?.holderTier !== undefined ? (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <span>Status</span>
                                <TierBadge tier={user.holderTier} />
                            </div>
                        ) : (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <span>Status</span>
                                <span style={{ fontSize: 12 }}>Guest</span>
                            </div>
                        )}

                        <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <span>Market Mood</span>
                                <span style={{
                                    fontWeight: 700,
                                    color: MOOD_CONFIG[marketStats?.mood]?.color || '#9ca3af',
                                    letterSpacing: '0.05em'
                                }}>
                                    {marketStats?.mood || 'QUIET'}
                                </span>
                            </div>

                            {/* Tags / Analytics Display */}
                            {marketStats?.tags && marketStats.tags.length > 0 && (
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8, justifyContent: 'flex-end' }}>
                                    {marketStats.tags.map(tag => (
                                        <span key={tag} style={{
                                            fontSize: 10,
                                            background: 'rgba(255,255,255,0.05)',
                                            padding: '1px 4px',
                                            borderRadius: 4,
                                            color: 'var(--text-secondary)'
                                        }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: 'var(--text-muted)' }}>
                                <span>24h Vol</span>
                                <span>{(marketStats?.volume24h || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="panel">
                    <div className="panel-title">Stats</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span>Lifetime Yield</span>
                            <span style={{ fontWeight: 600 }}>${Math.floor(lifetimeYield).toLocaleString()}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Total Clicks</span>
                            <span style={{ fontWeight: 600 }}>{totalClicks}</span>
                        </div>
                    </div>
                </div>
            </aside>

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                onConfirm={modalConfig.onConfirm}
                onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}

function getMoodColor(mood) {
    // Legacy helper kept for safety, but UI above uses registry directly
    const config = MOOD_CONFIG[mood];
    return config ? config.color : '#9ca3af';
}
