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

export function AppShell({ activeTab, onTabChange, centerContent }) {
    // Zustand store hooks
    const balance = useGameStore((s) => s.balance);
    const yps = useGameStore((s) => s.yps);
    const level = useGameStore((s) => s.level);
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
        <div className={`app-shell bg-abstract-hero bg-overlay ${isWideMode ? 'wide-mode' : ''}`} style={{
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            height: '100vh',
            width: '100vw'
        }}>
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
            {/* LEFT NAV — INFRA RAIL */}
            <aside className="navRail">
                {/* BRAND / SYSTEM */}
                <div className="navRail__brand">
                    <div className="navRail__logo">
                        <img src="/logo.png" alt="DIVIDENDS" />
                    </div>
                    <div className="navRail__brandText">
                        <span className="navRail__title">DIVIDENDS</span>
                        <span className="navRail__status">SYSTEM ONLINE</span>
                    </div>
                </div>

                {/* PRIMARY NAV */}
                <nav className="navRail__nav">
                    {[
                        { id: "dashboard", label: "Dashboard", icon: "🏠" },
                        { id: "streams", label: "Streams", icon: "📊" },
                        { id: "operations", label: "Operations", icon: "⚡" },
                        { id: "degen-arena", label: "Arena", icon: "🎰" },
                        { id: "leaderboard", label: "Leaderboard", icon: "🏆" },
                        { id: "community", label: "Community", icon: "🐦" },
                        { id: "settings", label: "Settings", icon: "⚙️" },
                        { id: "help", label: "Help", icon: "❓" },
                    ].map(item => {
                        const active = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                className={`navRail__item ${active ? 'is-active' : ''}`}
                                onClick={() => {
                                    soundManager.playClick();
                                    onTabChange(item.id);
                                }}
                                title={item.label}
                            >
                                <span className="navRail__icon">{item.icon}</span>
                                <span className="navRail__label">{item.label}</span>
                                {active && <span className="navRail__indicator" />}
                            </button>
                        );
                    })}
                </nav>

                {/* PRIMARY ACTION */}
                <div className="navRail__action">
                    <button className="navRail__farm" onClick={handleMine}>
                        <span className="navRail__icon">⛏</span>
                        <span className="navRail__label">FARM</span>
                    </button>
                </div>

                {/* OPERATOR FOOTER */}
                <div className="navRail__operator">
                    <div className="navRail__avatar">
                        {user?.handle?.[0]?.toUpperCase() || 'O'}
                    </div>

                    <div className="navRail__operatorText">
                        <div className="navRail__nameRow">
                            <span className="navRail__name">
                                {user?.displayName || 'Operator'}
                            </span>
                            <TierBadge />
                        </div>
                        <div className="navRail__meta mono">
                            ${balance.toFixed(0)} · ${yps.toFixed(2)}/s · Lvl {level}
                        </div>
                    </div>

                    <span className="navRail__more">⋯</span>
                </div>

                {/* SYSTEM FOOTER */}
                <div className="navRail__footer mono">
                    SOLANA_MAIN · v0.9.1
                </div>
            </aside>

            {/* CENTER MAIN */}
            <main className="app-main zone-center" style={{
                position: 'relative',
                zIndex: 10,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden', // Scroll handled by activeTab container if needed, or we allow main to scroll.
                padding: '0'
            }}>
                <div key={activeTab} className="tab-enter" style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    overflowY: 'auto', // Scroll content here
                    padding: '24px',
                    paddingBottom: '40px'
                }}>
                    {centerContent}
                </div>
            </main>

            {/* RIGHT SIDEBAR (Hidden in Wide Mode) */}
            {!isWideMode && (
                <aside className="app-right zone-right surface-subordinate" style={{
                    position: 'relative',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    width: '320px',
                    flexShrink: 0,
                    height: '100%',
                    overflowY: 'auto',
                    padding: '24px',
                    borderLeft: '1px solid var(--border-subtle)'
                }}>
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

                    {/* SYSTEM FEED */}
                    {!isWideMode && (
                        <div style={{ marginBottom: 16 }}>
                            <SystemFeed />
                        </div>
                    )}

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
            )}

        </div>
    );
}

function getMoodColor(mood) {
    const config = MOOD_CONFIG[mood];
    return config ? config.color : '#9ca3af';
}
