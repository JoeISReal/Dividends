import React, { useState, useEffect } from 'react';
import { useGameStore } from '../state/gameStore';

export default function LeaderboardTab() {
    const auth = useGameStore(s => s.auth);
    const leaderboard = useGameStore(s => s.leaderboard);
    const leaderboardLoading = useGameStore(s => s.leaderboardLoading);
    const login = useGameStore(s => s.login);
    const fetchLeaderboard = useGameStore(s => s.fetchLeaderboard);
    const syncScore = useGameStore(s => s.syncScore);

    const [isConnecting, setIsConnecting] = useState(false);
    const [walletError, setWalletError] = useState(null);

    // Initial load
    useEffect(() => {
        fetchLeaderboard();
        if (auth.isAuthenticated) {
            syncScore();
        }
    }, []);

    const connectPhantom = async () => {
        setIsConnecting(true);
        setWalletError(null);

        try {
            const { solana } = window;
            if (solana && solana.isPhantom) {
                const response = await solana.connect();
                const walletAddress = response.publicKey.toString();

                // Use wallet address as handle
                const success = await login(walletAddress);
                if (success) {
                    await syncScore();
                    fetchLeaderboard();
                } else {
                    useGameStore.getState().showNotification("Login Failed: Server Error", "error");
                }
            } else {
                setWalletError("Phantom Wallet not found! Please install it.");
            }
        } catch (err) {
            console.error("Wallet connection failed", err);
            setWalletError("Connection rejected or failed.");
        }
        setIsConnecting(false);
    };

    if (!auth.isAuthenticated) {
        return (
            <div style={{ padding: 20, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 20 }}>👻</div>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>Global Leaderboard</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 30, maxWidth: 300 }}>
                    Compete for Degen glory. Connect your wallet to save your empire's stats forever.
                </p>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 16, width: '100%', maxWidth: 320 }}>
                    <button
                        className="btn-primary"
                        style={{
                            width: '100%',
                            background: '#AB9FF2',
                            color: '#000',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 12,
                            fontWeight: 700
                        }}
                        onClick={connectPhantom}
                        disabled={isConnecting}
                    >
                        {isConnecting ? 'Connecting...' : 'Connect Phantom 👻'}
                    </button>

                    {walletError && (
                        <div style={{ color: '#ff4d4d', fontSize: 12, marginTop: 10, padding: 8, background: 'rgba(255,0,0,0.1)', borderRadius: 8 }}>
                            {walletError}
                            {!window.solana && (
                                <a href="https://phantom.app/" target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 4, color: '#AB9FF2', textDecoration: 'underline' }}>
                                    Install Phantom
                                </a>
                            )}
                        </div>
                    )}
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

            <div style={{ marginBottom: 20, background: 'rgba(171, 159, 242, 0.1)', border: '1px solid rgba(171, 159, 242, 0.3)', padding: '12px 20px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#AB9FF2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                        👻
                    </div>
                    <div>
                        <div style={{ fontSize: 10, color: '#AB9FF2', fontWeight: 600 }}>CONNECTED</div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>
                            {auth.user?.handle?.slice(0, 4)}...{auth.user?.handle?.slice(-4)}
                        </span>
                    </div>
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
                                    background: u.handle === auth.user?.handle ? 'rgba(171, 159, 242, 0.1)' : 'transparent'
                                }}>
                                    <td style={{ padding: 12, width: 40 }}>
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                    </td>
                                    <td style={{ padding: 12, fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>
                                        {u.handle?.slice(0, 4)}...{u.handle?.slice(-4)}
                                    </td>
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
    if (!handle) return '-';
    // Handle specific string comparison (exact match)
    const idx = list.findIndex(u => u.handle === handle);
    return idx === -1 ? '-' : idx + 1;
}
