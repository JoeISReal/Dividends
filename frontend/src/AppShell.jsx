import React from "react";
import { useGameStore } from "./state/gameStore";
import { soundManager } from "./game/SoundManager";

import { TierBadge } from "./components/TierBadge";
import ArenaIntro from "./components/ArenaIntro";
import "./styles/dividends-theme.css";
import { MOOD_CONFIG } from './cosmetics/registry';
import { TrendingPanel } from './components/TrendingPanel';
import { SystemFeed } from './components/SystemFeed';
import { BagsWidget } from './components/BagsWidget';
import { EcosystemMoodPanel } from './components/EcosystemMoodPanel';

export function AppShell({ activeTab, onTabChange, centerContent, liveDegens }) {
    // Zustand store hooks
    const balance = useGameStore((s) => s.balance);
    const yps = useGameStore((s) => s.yps);
    const level = useGameStore((s) => s.level); // Added Level
    const lifetimeYield = useGameStore((s) => s.lifetimeYield);
    const totalClicks = useGameStore((s) => s.totalClicks);
    const yieldPerClick = useGameStore((s) => s.yieldPerClick);
    const clickMultiplier = useGameStore((s) => s.multipliers.click);
    const prestigeMultiplier = useGameStore((s) => s.multipliers.prestige);
    const user = useGameStore((s) => s.auth.user);
    const marketStats = useGameStore((s) => s.marketStats);
    const bagsStatusError = useGameStore((s) => s.bagsStatusError);
    const fetchBagsStatus = useGameStore((s) => s.fetchBagsStatus);

    // Actions
    const registerClick = useGameStore((s) => s.registerClick);
    const doPrestige = useGameStore((s) => s.doPrestige);

    const handleMine = () => {
        soundManager.playClick();
        registerClick();
    };

    const effectiveClickYield = yieldPerClick * clickMultiplier;

    const isWideMode = activeTab === 'degen-arena';

    return (
        <div className={`app-shell bg-abstract-hero bg-overlay ${isWideMode ? 'wide-mode' : ''}`} style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Ambient & HUD Layers */}
            <div className="ambient-grid animate-ambient-drift" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
            <div className="hud-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                <div className="hud-top-left" style={{ opacity: 0.5 }}>
                    <div>SYSTEM: ONLINE</div>
                    <div>NET: SOLANA_MAIN</div>
                </div>
                <div className="hud-btm-right" style={{ opacity: 0.5 }}>
                    <div>SECURE LINK</div>
                    <div>V 0.9.1</div>
                </div>
            </div>

            {/* Arena Intro Overlay (Scoped to Tab) */}
            {isWideMode && <ArenaIntro />}

            {/* LEFT NAV (X-STYLE RAIL) */}
            <aside className="nav-rail" style={{ position: 'relative', zIndex: 10, paddingBottom: '120px' }}>
                {/* 1. APP LOGO (Minimal) */}
                <div style={{ padding: '0 12px', marginBottom: 24, display: 'flex', alignItems: 'center' }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: '50%', overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <img src="/logo.png" alt="Divs" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                </div>

                {/* 2. NAVIGATION LINKS */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[
                        { id: "dashboard", label: "Dashboard", icon: "🏠" },
                        { id: "streams", label: "Streams", icon: "📊" },
                        { id: "operations", label: "Operations", icon: "⚡" },
                        { id: "degen-arena", label: "Degen Arena", icon: "🎰" },
                        { id: "leaderboard", label: "Leaderboard", icon: "🏆" },
                        { id: "community", label: "Community", icon: "🐦" },
                        { id: "settings", label: "Settings", icon: "⚙️" },
                        { id: "help", label: "Help", icon: "❓" },
                    ].map(item => (
                        <div
                            key={item.id}
                            className={`nav-item-x ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => {
                                onTabChange(item.id);
                                soundManager.playClick();
                            }}
                        >
                            <div className="nav-icon">{item.icon}</div>
                            <span className="nav-label">{item.label}</span>
                        </div>
                    ))}

                    {/* PRIMARY ACTION (FARM) */}
                    <div style={{ padding: '16px 0', marginTop: 12 }}>
                        <button
                            onClick={handleMine}
                            className="btn-action-primary"
                            style={{
                                width: '90%',
                                borderRadius: 999,
                                height: 52,
                                fontSize: 17,
                                fontWeight: 800,
                                boxShadow: 'none', // Flat style constraint
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto',
                                background: 'var(--text-primary)', // White/Bright for X style "Post" button
                                color: '#000'
                            }}
                        >
                            FARM
                        </button>
                    </div>
                </nav>

                {/* 3. MINI PROFILE (Bottom Anchor) */}
                <div style={{
                    marginTop: 'auto',
                    padding: 12,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    position: 'relative'
                }}
                    className="nav-item-x" /* Reuse hover styles */
                    onClick={() => {
                        soundManager.playClick();
                        onTabChange('prestige');
                    }}
                >
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#333', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {/* Placeholder Avatar or Initials */}
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-green)', color: '#000', fontWeight: 700 }}>
                            {user?.handle ? user.handle.substring(0, 1).toUpperCase() : 'G'}
                        </div>
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.displayName || 'Degen Operator'}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            ${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                    <div style={{ fontSize: 14 }}>➜</div>
                </div>

                {/* Quick YPS Ticker (Infrastructure style) */}
                <div style={{
                    padding: '0 16px 24px 16px',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <span style={{ color: 'var(--accent-green)' }}>▲ ${yps.toFixed(2)}/s</span>
                    <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
                    {/* Show Level by default, or Prestige if active (>1) */}
                    {prestigeMultiplier > 1.0 ? (
                        <span>x{prestigeMultiplier.toFixed(2)}</span>
                    ) : (
                        <span style={{ color: 'var(--text-primary)' }}>Lvl {level}</span>
                    )}
                </div>
                <div style={{ minHeight: '120px' }}></div>
            </aside>

            {/* CENTER MAIN */}
            <main className="app-main zone-center" style={{ position: 'relative', zIndex: 10, paddingBottom: '150px' }}>
                <div key={activeTab} className="tab-enter" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {centerContent}
                </div>
            </main>

            {/* RIGHT SIDEBAR (Hidden in Wide Mode) */}
            {!isWideMode && (
                <aside className="app-right zone-right surface-subordinate" style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingBottom: '120px' }}>
                    {activeTab === 'streams' && (
                        <TrendingPanel />
                    )}

                    {/* BAGS WIDGET */}
                    <div style={{ marginBottom: 16 }}>
                        <BagsWidget />
                    </div>

                    {/* ECOSYSTEM STATUS */}
                    <div style={{ marginBottom: 16 }}>
                        <EcosystemMoodPanel />
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

                    {/* SYSTEM FEED - "The Pulse" (HIDDEN BY USER REQUEST) */}
                    {/* <div style={{ marginTop: 'auto', flexShrink: 0 }}>
                        <SystemFeed limit={6} />
                    </div> */}
                </aside>
            )}

        </div>
    );

}

function getMoodColor(mood) {
    // Legacy helper kept for safety, but UI above uses registry directly
    const config = MOOD_CONFIG[mood];
    return config ? config.color : '#9ca3af';
}
