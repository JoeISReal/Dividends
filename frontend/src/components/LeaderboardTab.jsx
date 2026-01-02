import React, { useState, useEffect } from 'react';
import { useGameStore } from '../state/gameStore';

import { soundManager } from '../game/SoundManager';
import { TierBadge } from './TierBadge';

export default function LeaderboardTab() {
    const auth = useGameStore(s => s.auth);


    // Game Leaderboard only
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

    const isLoading = leaderboardLoading;
    const listData = leaderboard;

    const handleRefresh = () => {
        soundManager.playClick();
        syncScore();
        fetchLeaderboard();
    };

    return (
        <div style={{ padding: '0 var(--space-4) var(--space-4)', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="main-header" style={{ marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="main-title" style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>🏆 Leaderboard</div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        className="btn-action-meta"
                        onClick={handleRefresh}
                        title="Refresh Leaderboard"
                        style={{
                            fontSize: 12,
                            background: 'transparent',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px 10px',
                            gap: 6,
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            borderRadius: 'var(--radius-sm)'
                        }}
                    >
                        <span>🔄</span>
                    </button>
                </div>
            </div>

            {/* Game Stats Header */}
            <div className="surface-primary" style={{ marginBottom: 20, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 0 10px rgba(245, 199, 122, 0.4)', color: 'var(--bg-root)', overflow: 'hidden' }}>
                        {auth.user?.avatar ? (
                            <img src={auth.user.avatar} alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            '👻'
                        )}
                    </div>
                    <div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-gold)', fontWeight: 700, letterSpacing: '0.1em' }}>YOU</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 16 }}>
                                {auth.user?.displayName || (auth.user?.handle ? `${auth.user.handle.slice(0, 4)}...${auth.user.handle.slice(-4)}` : 'Guest')}
                            </span>
                            <div style={{
                                width: 8, height: 8,
                                background: 'var(--accent-green)',
                                borderRadius: '50%',
                                boxShadow: '0 0 5px var(--accent-green)'
                            }} />
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                            <span style={{ fontSize: 10, background: 'var(--accent-gold)', color: 'var(--bg-root)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                LVL {useGameStore.getState().level}
                            </span>
                            {auth.user?.holderTier && auth.user.holderTier !== 'NONE' && (
                                <TierBadge tierOverride={null} balance={auth.user.holderBalanceApprox || 0} size="sm" showName={false} />
                            )}
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Current Rank</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>#{getUserRank(leaderboard, auth.user?.handle)}</div>
                </div>
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                    Loading players...
                </div>
            ) : (
                <div className="leaderboard-list" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {listData
                        .filter(u => {
                            const h = u.handle || '';
                            if (h.startsWith('naSo') || h.startsWith('NaSo') || h.includes('Solx')) return false;
                            const d = u.displayName || '';
                            if (d.toLowerCase().includes('fsvn') || h.toLowerCase().includes('fsvn')) return false;
                            return true;
                        })
                        .map((u, i) => {
                            const isMe = u.handle === auth.user?.handle;
                            const isTop3 = i < 3;

                            // Top 3 Visuals
                            let bg = 'transparent';
                            if (isMe) bg = 'rgba(245, 199, 122, 0.08)'; // Subtle gold tint
                            else if (isTop3) bg = 'var(--bg-panel-soft)';
                            else if (i % 2 === 1) bg = 'rgba(255,255,255,0.01)'; // Zebra striping

                            let border = isMe ? '1px solid var(--accent-gold)' : (isTop3 ? '1px solid var(--border-subtle)' : '1px solid transparent');

                            return (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: isTop3 ? '16px 24px' : '8px 16px',
                                    background: bg,
                                    border: border,
                                    borderRadius: 12,
                                    cursor: 'default',
                                }}>
                                    <div style={{ width: 40, textAlign: 'center', fontSize: isTop3 ? 20 : 14, fontWeight: 700, color: i < 3 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                        {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                    </div>
                                    <div style={{
                                        width: isTop3 ? 42 : 32,
                                        height: isTop3 ? 42 : 32,
                                        borderRadius: '50%',
                                        background: isTop3 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, fontSize: isTop3 ? 20 : 14
                                    }}>
                                        {u.avatar ? (
                                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                                                <img src={u.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        ) : (
                                            u.holderTier === 'inner_circle' ? '👑' : '👤'
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontWeight: 600, fontSize: isTop3 ? 16 : 14, color: isMe ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                                                {u.displayName || `${u.handle?.slice(0, 4)}...${u.handle?.slice(-4)}`}
                                            </span>
                                            <TierBadge balance={u.holderBalanceApprox || 0} size="xs" showName={false} />
                                        </div>
                                        {isTop3 && (
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                                                LVL {u.level || 1} • {u.handle?.slice(0, 4)}...{u.handle?.slice(-4)}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: 'var(--accent-green)', fontWeight: 600, fontFamily: 'monospace', fontSize: isTop3 ? 16 : 14 }}>
                                            ${u.lifetimeYield?.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                    {Array.from({ length: Math.max(0, 10 - listData.length) }).map((_, idx) => (
                        <div key={`recruiting-${idx}`} style={{
                            display: 'flex', alignItems: 'center', padding: '8px 16px',
                            border: '1px dashed var(--border-muted)', borderRadius: 12, opacity: 0.5
                        }}>
                            <div style={{ width: 40, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>-</div>
                            <div style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Recruiting...</div>
                        </div>
                    ))}
                </div>
            )}
        </div >
    );
}

function getUserRank(list, handle) {
    if (!handle) return '-';
    const idx = list.findIndex(u => u.handle === handle);
    return idx === -1 ? '-' : idx + 1;
}

function formatShorthand(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
}
