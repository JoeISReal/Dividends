import React from "react";
import { useGameStore } from "./state/gameStore";
import "./styles/dividends-theme.css";

export function AppShell({ activeTab, onTabChange, centerContent, liveDegens }) {
    // Zustand store hooks
    const balance = useGameStore((s) => s.balance);
    const yps = useGameStore((s) => s.yps);
    const lifetimeYield = useGameStore((s) => s.lifetimeYield);
    const totalClicks = useGameStore((s) => s.totalClicks);
    const yieldPerClick = useGameStore((s) => s.yieldPerClick);
    const prestigeMultiplier = useGameStore((s) => s.multipliers.prestige);

    // Actions
    const registerClick = useGameStore((s) => s.registerClick);
    const doPrestige = useGameStore((s) => s.doPrestige);

    const handleMine = () => {
        registerClick();
    };

    const handlePrestige = () => {
        if (confirm("Prestige: reset streams for a shareholder multiplier. Confirm?")) {
            const bonus = doPrestige();
            alert(`Prestige complete! Gained +${bonus} to multiplier!`);
        }
    };

    return (
        <div className="app-shell bg-abstract-hero bg-overlay">{/* LEFT NAV */}
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
                        { id: "help", label: "Help", icon: "❓" },
                    ].map(item => (
                        <div
                            key={item.id}
                            className={
                                "nav-item" + (activeTab === item.id ? " nav-item--active" : "")
                            }
                            onClick={() => onTabChange(item.id)}
                        >
                            <div className="nav-item-icon">{item.icon}</div>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>

                <div className="nav-card">
                    <button className="btn-primary" style={{ width: "100%" }} onClick={handleMine}>
                        FARM (+{yieldPerClick})
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
                        onClick={handlePrestige}
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
        </div>
    );
}
