import React, { useState, useEffect } from 'react';
import { useGameStore } from '../state/gameStore';
import { useToast } from './ToastProvider';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function LeaderboardModPanel() {
    const auth = useGameStore(s => s.auth);
    const { showToast, confirm } = useToast();
    const [users, setUsers] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [loading, setLoading] = useState(false);

    // Only show to ADMIN
    const userRole = auth.user?.role;
    if (userRole !== 'ADMIN') {
        return null;
    }

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput.trim()) {
                fetchUsers();
            } else {
                setUsers([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/users?search=${searchInput}`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (e) {
            console.error('[LeaderboardMod] Fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    const toggleHidden = async (handle, currentlyHidden) => {
        const action = currentlyHidden ? 'unhide' : 'hide';
        const confirmMsg = currentlyHidden
            ? `Show ${handle.slice(0, 8)}... on leaderboard?`
            : `Hide ${handle.slice(0, 8)}... from leaderboard?`;

        confirm(confirmMsg, async () => {
            try {
                const res = await fetch(`${API_BASE}/api/admin/leaderboard/${action}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ targetHandle: handle })
                });

                if (res.ok) {
                    fetchUsers(); // Refresh
                    showToast(`User ${action === 'hide' ? 'hidden from' : 'shown on'} leaderboard`, 'success');
                } else {
                    const error = await res.json();
                    showToast(`Error: ${error.error}`, 'error');
                }
            } catch (e) {
                console.error(`${action} error:`, e);
                showToast(`Failed to ${action} user`, 'error');
            }
        });
    };

    return (
        <div style={{
            marginTop: '20px',
            background: 'rgba(255,59,48,0.02)',
            border: '1px solid rgba(255,59,48,0.3)',
            borderRadius: '12px',
            padding: '18px'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '16px' }}>
                <h3 style={{
                    fontSize: '13px',
                    margin: '0 0 6px 0',
                    color: '#ff453a',
                    fontWeight: 700,
                    letterSpacing: '0.5px'
                }}>🏆 LEADERBOARD MODERATION</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                    Hide test accounts and spam from leaderboard • ADMIN ONLY
                </p>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '16px' }}>
                <input
                    type="text"
                    placeholder="🔍 Search by wallet to hide/unhide..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '13px'
                    }}
                />
            </div>

            {/* Users List */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '12px' }}>
                        Loading...
                    </div>
                ) : users.length === 0 && searchInput ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '12px' }}>
                        No users found
                    </div>
                ) : users.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '12px' }}>
                        Search for a user to hide/unhide from leaderboard
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {users.map((user) => (
                            <div key={user.handle} style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '12px'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                        {user.displayName || 'Anonymous'}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                        {user.handle.slice(0, 8)}...{user.handle.slice(-6)}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Level {user.level || 1} • {user.role || 'USER'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {user.hiddenFromLeaderboard && (
                                        <div style={{
                                            padding: '3px 8px',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            background: 'rgba(255,59,48,0.15)',
                                            color: '#ff453a'
                                        }}>
                                            HIDDEN
                                        </div>
                                    )}\r
                                    <button
                                        onClick={() => toggleHidden(user.handle, user.hiddenFromLeaderboard)}
                                        style={{
                                            padding: '6px 12px',
                                            fontSize: '11px',
                                            background: user.hiddenFromLeaderboard ? 'rgba(76,217,100,0.1)' : 'rgba(255,59,48,0.1)',
                                            border: user.hiddenFromLeaderboard ? '1px solid rgba(76,217,100,0.3)' : '1px solid rgba(255,59,48,0.3)',
                                            borderRadius: '4px',
                                            color: user.hiddenFromLeaderboard ? '#30d158' : '#ff453a',
                                            cursor: 'pointer',
                                            fontWeight: 600
                                        }}
                                    >
                                        {user.hiddenFromLeaderboard ? '✓ Show' : '✕ Hide'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            confirm(`Reset stats for ${user.displayName || user.handle.slice(0, 8)}? This will set their level and earnings to 0.`, async () => {
                                                try {
                                                    const res = await fetch(`${API_BASE}/api/admin/users/reset-stats`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        credentials: 'include',
                                                        body: JSON.stringify({ targetHandle: user.handle })
                                                    });
                                                    if (res.ok) {
                                                        showToast('User stats reset', 'success');
                                                        fetchUsers();
                                                    } else {
                                                        showToast('Failed to reset stats', 'error');
                                                    }
                                                } catch (e) {
                                                    console.error('Reset error:', e);
                                                    showToast('Error resetting stats', 'error');
                                                }
                                            });
                                        }}
                                        style={{
                                            padding: '6px 12px',
                                            fontSize: '11px',
                                            background: 'rgba(255,159,10,0.1)',
                                            border: '1px solid rgba(255,159,10,0.3)',
                                            borderRadius: '4px',
                                            color: '#ff9f0a',
                                            cursor: 'pointer',
                                            fontWeight: 600
                                        }}
                                    >
                                        ↻ Reset
                                    </button>
                                    <button
                                        onClick={() => {
                                            confirm(`DELETE ${user.displayName || user.handle.slice(0, 8)}? This action CANNOT be undone!`, () => {
                                                confirm('Are you ABSOLUTELY sure? This will permanently delete the user account.', async () => {
                                                    try {
                                                        const res = await fetch(`${API_BASE}/api/admin/users/delete`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            credentials: 'include',
                                                            body: JSON.stringify({ targetHandle: user.handle })
                                                        });
                                                        if (res.ok) {
                                                            showToast('User deleted', 'success');
                                                            fetchUsers();
                                                        } else {
                                                            showToast('Failed to delete user', 'error');
                                                        }
                                                    } catch (e) {
                                                        console.error('Delete error:', e);
                                                        showToast('Error deleting user', 'error');
                                                    }
                                                });
                                            });
                                        }}
                                        style={{
                                            padding: '6px 12px',
                                            fontSize: '11px',
                                            background: 'rgba(255,59,48,0.15)',
                                            border: '1px solid rgba(255,59,48,0.4)',
                                            borderRadius: '4px',
                                            color: '#ff453a',
                                            cursor: 'pointer',
                                            fontWeight: 600
                                        }}
                                    >
                                        🗑 Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
