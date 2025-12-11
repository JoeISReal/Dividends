import React, { useState, useEffect } from 'react';
import { useGameStore } from '../state/gameStore';
import { soundManager } from '../game/SoundManager';

export default function LeaderboardTab() {
    const auth = useGameStore(s => s.auth);
    const leaderboard = useGameStore(s => s.leaderboard);
    const leaderboardLoading = useGameStore(s => s.leaderboardLoading);
    const fetchLeaderboard = useGameStore(s => s.fetchLeaderboard);
    const syncScore = useGameStore(s => s.syncScore);

    // Initial load
    useEffect(() => {
        fetchLeaderboard();
        if (auth.isAuthenticated) {
            syncScore();
        }
    }, []);



    return (
        <div style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="main-header">
                <div className="main-title">🏆 Leaderboard</div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        className="btn-secondary"
                        onClick={() => {
                            soundManager.playClick();
                            syncScore();
                            fetchLeaderboard();
                        }}
                        title="Refresh Leaderboard"
                        style={{
                            fontSize: 12,
                            background: 'transparent',
                            border: '1px solid rgba(171, 159, 242, 0.4)',
                            color: '#AB9FF2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px 10px',
                            gap: 6,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(171, 159, 242, 0.1)';
                            e.currentTarget.style.borderColor = '#AB9FF2';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'rgba(171, 159, 242, 0.4)';
                        }}
                    >
                        <span>🔄</span>
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: 20, background: 'rgba(171, 159, 242, 0.1)', border: '1px solid rgba(171, 159, 242, 0.3)', padding: '12px 20px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#AB9FF2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                        👻
                    </div>
                    <div>
                        <div style={{ fontSize: 10, color: '#AB9FF2', fontWeight: 600 }}>CONNECTED</div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>
                            {auth.user?.displayName || (auth.user?.handle ? `${auth.user.handle.slice(0, 4)}...${auth.user.handle.slice(-4)}` : '')}
                        </span>
                        <span style={{
                            marginLeft: 8,
                            fontSize: 10,
                            background: 'var(--gold)',
                            color: '#000',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontWeight: 700
                        }}>
                            LVL {useGameStore.getState().level}
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
                            {leaderboard
                                .filter(u => {
                                    const h = u.handle || '';
                                    // Filter out the "naSo...Solx" or similar specific unwanted entries
                                    if (h.startsWith('naSo') || h.startsWith('NaSo') || h.includes('Solx')) return false;
                                    return true;
                                })
                                .map((u, i) => (
                                    <tr key={i} style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        background: u.handle === auth.user?.handle ? 'rgba(171, 159, 242, 0.1)' : 'transparent'
                                    }}>
                                        <td style={{ padding: 12, width: 40 }}>
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                        </td>
                                        <td style={{ padding: 12 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 600, fontSize: 13, color: u.displayName ? '#fff' : 'var(--text-secondary)' }}>
                                                    {u.displayName || `${u.handle?.slice(0, 4)}...${u.handle?.slice(-4)}`}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-muted)' }}>
                                                    {u.displayName && <span style={{ fontFamily: 'monospace' }}>{u.handle?.slice(0, 4)}</span>}
                                                    <span style={{
                                                        background: 'rgba(255,255,255,0.1)',
                                                        padding: '1px 4px',
                                                        borderRadius: 3,
                                                        color: '#AB9FF2'
                                                    }}>
                                                        Lvl {u.level || 1}
                                                    </span>
                                                </div>
                                            </div>
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
