import React, { useState, useEffect } from 'react';
import { useGameStore } from '../state/gameStore';

export default function LeaderboardTab() {
    const auth = useGameStore(s => s.auth);
    const leaderboard = useGameStore(s => s.leaderboard);
    const leaderboardLoading = useGameStore(s => s.leaderboardLoading);
    const login = useGameStore(s => s.login);
    const fetchLeaderboard = useGameStore(s => s.fetchLeaderboard);
    const syncScore = useGameStore(s => s.syncScore);

    const [handleInput, setHandleInput] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Initial load
    useEffect(() => {
        fetchLeaderboard();
        if (auth.isAuthenticated) {
            syncScore();
        }
    }, []);

    const handleLogin = async () => {
        if (!handleInput.trim()) return;
        setIsLoggingIn(true);
        // Simulate X auth delay + store call
        await new Promise(r => setTimeout(r, 800));
        const cleanHandle = handleInput.trim().replace(/^@/, '');
        const success = await login(cleanHandle);
        if (success) {
            await syncScore();
            fetchLeaderboard();
        } else {
            // No alert() - use console or just fail silently if store handled it.
            // But better, let's use the new notification if we can access it, 
            // or just rely on the store logging error.
            console.error("Login failed. Check connection.");
            useGameStore.getState().showNotification("Connection Failed: Backend not reachable", "error");
        }
        setIsLoggingIn(false);
    };

    if (!auth.isAuthenticated) {
        return (
            <div style={{ padding: 20, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 20 }}>🏆</div>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>Global Leaderboard</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 30, maxWidth: 300 }}>
                    Compete with other degens. Sign in to track your rank and prove your empire is the strongest.
                </p>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 16, width: '100%', maxWidth: 320 }}>
                    <input
                        type="text"
                        placeholder="@username"
                        value={handleInput}
                        onChange={(e) => setHandleInput(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.3)',
                            color: '#fff',
                            marginBottom: 16,
                            fontSize: 16,
                            textAlign: 'center'
                        }}
                    />

                    <button
                        className="btn-primary"
                        style={{ width: '100%', background: '#1DA1F2', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 12 }}
                        onClick={handleLogin}
                        disabled={isLoggingIn}
                    >
                        {isLoggingIn ? 'Connecting...' : (
                            <>
                                <span>Sign in with 𝕏</span>
                            </>
                        )}
                    </button>

                    <button
                        className="btn-primary"
                        style={{ width: '100%', background: '#333', cursor: 'not-allowed', opacity: 0.6 }}
                        disabled={true}
                    >
                        👻 Sign in with Phantom (Soon)
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="main-header">
                <div className="main-title">🏆 Leaderboard</div>
                <button
                    className="btn-secondary"
                    onClick={() => {
                        syncScore();
                        fetchLeaderboard();
                    }}
                    style={{ fontSize: 12 }}
                >
                    🔄 Refresh
                </button>
            </div>

            <div style={{ marginBottom: 20, background: 'rgba(59, 255, 176, 0.1)', border: '1px solid rgba(59, 255, 176, 0.2)', padding: '12px 20px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1DA1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                        {auth.user?.handle?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span style={{ fontWeight: 600 }}>{auth.user?.handle?.startsWith('@') ? auth.user.handle : '@' + auth.user?.handle}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Rank: <span style={{ color: '#fff', fontWeight: 700 }}>#{getUserRank(leaderboard, auth.user?.handle)}</span>
                </div>
            </div>

            {leaderboardLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Loading ranks...</div>
            ) : (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-secondary)', fontSize: 12, textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: 10 }}>#</th>
                                <th style={{ padding: 10 }}>Player</th>
                                <th style={{ padding: 10, textAlign: 'right' }}>Lifetime Yield</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((u, i) => (
                                <tr key={i} style={{
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    background: u.handle === auth.user?.handle ? 'rgba(255,255,255,0.05)' : 'transparent'
                                }}>
                                    <td style={{ padding: 12, width: 40 }}>
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                    </td>
                                    <td style={{ padding: 12, fontWeight: 600 }}>{u.handle?.startsWith('@') ? u.handle : '@' + u.handle}</td>
                                    <td style={{ padding: 12, textAlign: 'right', color: 'var(--accent-green)', fontFamily: 'monospace' }}>
                                        ${u.lifetimeYield?.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function getUserRank(list, handle) {
    const idx = list.findIndex(u => u.handle.toLowerCase() === handle.toLowerCase());
    return idx === -1 ? '-' : idx + 1;
}
