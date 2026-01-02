import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../state/gameStore';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function ModeratorPanel() {
    const auth = useGameStore(s => s.auth);
    const [users, setUsers] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Fetch users
    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString(),
                ...(searchQuery && { search: searchQuery })
            });

            const res = await fetch(`${API_BASE}/api/community/mod/users?${params}`, {
                credentials: 'include'
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
                setPagination(data.pagination);
            } else {
                console.error("[ModPanel] Failed to fetch users:", res.status);
            }
        } catch (e) {
            console.error("[ModPanel] Fetch users error:", e);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, pagination.limit]);

    useEffect(() => {
        fetchUsers(1);
    }, [searchQuery, fetchUsers]);

    // Moderation actions
    const performAction = async (action, targetHandle, displayName) => {
        const actionNames = {
            ban: 'Ban',
            unban: 'Unban',
            mute: 'Mute',
            unmute: 'Unmute',
            shadow: 'Shadow Ban',
            unshadow: 'Remove Shadow Ban'
        };

        if (!confirm(`${actionNames[action]} ${displayName || targetHandle.slice(0, 8)}?`)) return;

        let reason = '';
        if (action === 'ban' || action === 'mute' || action === 'shadow') {
            reason = prompt('Reason (optional):') || 'No reason provided';
        }

        let duration = null;
        if (action === 'mute') {
            const durationInput = prompt('Duration in minutes (default: 5):', '5');
            duration = parseInt(durationInput) * 60 * 1000;
        }

        try {
            const res = await fetch(`${API_BASE}/api/community/mod/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ targetHandle, reason, duration })
            });

            if (res.ok) {
                fetchUsers(pagination.page);
                alert(`✅ ${actionNames[action]} successful`);
            } else {
                const error = await res.json();
                alert(`❌ Error: ${error.error}`);
            }
        } catch (e) {
            console.error(`${action} error:`, e);
            alert(`❌ Failed to ${action}`);
        }
    };

    // Only show to MOD and ADMIN users
    const userRole = auth.user?.role;
    if (userRole !== 'MOD' && userRole !== 'ADMIN') {
        return null;
    }

    const getStatusBadges = (user) => {
        const badges = [];
        if (user.chatBanned) badges.push({ text: 'BANNED', color: '#ff453a', bg: 'rgba(255,59,48,0.15)' });
        if (user.shadowBanned) badges.push({ text: 'SHADOW', color: '#ff9f0a', bg: 'rgba(255,165,0,0.15)' });
        if (user.mutedUntil && new Date(user.mutedUntil) > new Date()) {
            const remaining = Math.ceil((new Date(user.mutedUntil) - new Date()) / 60000);
            badges.push({ text: `MUTED (${remaining}m)`, color: '#ff9f0a', bg: 'rgba(255,165,0,0.15)' });
        }
        return badges;
    };

    return (
        <div style={{
            marginTop: '24px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '20px'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                    fontSize: '14px',
                    margin: '0 0 6px 0',
                    color: '#ff9f0a',
                    fontWeight: 700,
                    letterSpacing: '0.5px'
                }}>🛡️ MODERATOR PANEL</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                    Manage user moderation • {pagination.total || 0} users
                </p>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '16px' }}>
                <input
                    type="text"
                    placeholder="🔍 Search by wallet or name..."
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
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                        <div style={{ fontSize: '12px' }}>Loading...</div>
                    </div>
                ) : users.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
                        <div style={{ fontSize: '12px' }}>No users found</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {users.map((user) => {
                            const statusBadges = getStatusBadges(user);
                            return (
                                <div key={user.handle} style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    fontSize: '12px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                                {user.displayName || 'Anonymous'}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                                {user.handle.slice(0, 8)}...{user.handle.slice(-6)}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            {statusBadges.map((badge, idx) => (
                                                <div key={idx} style={{
                                                    padding: '3px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    background: badge.bg,
                                                    color: badge.color
                                                }}>
                                                    {badge.text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {user.chatBanned ? (
                                            <button onClick={() => performAction('unban', user.handle, user.displayName)} style={{ padding: '6px 12px', fontSize: '11px', background: 'rgba(76,217,100,0.1)', border: '1px solid rgba(76,217,100,0.3)', borderRadius: '4px', color: '#30d158', cursor: 'pointer', fontWeight: 600 }}>✓ Unban</button>
                                        ) : (
                                            <button onClick={() => performAction('ban', user.handle, user.displayName)} style={{ padding: '6px 12px', fontSize: '11px', background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)', borderRadius: '4px', color: '#ff453a', cursor: 'pointer', fontWeight: 600 }}>🚫 Ban</button>
                                        )}
                                        {user.mutedUntil && new Date(user.mutedUntil) > new Date() ? (
                                            <button onClick={() => performAction('unmute', user.handle, user.displayName)} style={{ padding: '6px 12px', fontSize: '11px', background: 'rgba(76,217,100,0.1)', border: '1px solid rgba(76,217,100,0.3)', borderRadius: '4px', color: '#30d158', cursor: 'pointer', fontWeight: 600 }}>🔊 Unmute</button>
                                        ) : (
                                            <button onClick={() => performAction('mute', user.handle, user.displayName)} style={{ padding: '6px 12px', fontSize: '11px', background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)', borderRadius: '4px', color: '#ff9f0a', cursor: 'pointer', fontWeight: 600 }}>🔇 Mute</button>
                                        )}
                                        {user.shadowBanned ? (
                                            <button onClick={() => performAction('unshadow', user.handle, user.displayName)} style={{ padding: '6px 12px', fontSize: '11px', background: 'rgba(76,217,100,0.1)', border: '1px solid rgba(76,217,100,0.3)', borderRadius: '4px', color: '#30d158', cursor: 'pointer', fontWeight: 600 }}>👁️ Unshadow</button>
                                        ) : (
                                            <button onClick={() => performAction('shadow', user.handle, user.displayName)} style={{ padding: '6px 12px', fontSize: '11px', background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)', borderRadius: '4px', color: '#ff9f0a', cursor: 'pointer', fontWeight: 600 }}>👻 Shadow</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '16px', fontSize: '12px' }}>
                    <button onClick={() => fetchUsers(pagination.page - 1)} disabled={pagination.page === 1} style={{ padding: '6px 14px', opacity: pagination.page === 1 ? 0.5 : 1, cursor: pagination.page === 1 ? 'not-allowed' : 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: 'var(--text-primary)' }}>← Prev</button>
                    <span style={{ padding: '6px 12px', color: 'var(--text-muted)' }}>Page {pagination.page}/{pagination.pages}</span>
                    <button onClick={() => fetchUsers(pagination.page + 1)} disabled={pagination.page === pagination.pages} style={{ padding: '6px 14px', opacity: pagination.page === pagination.pages ? 0.5 : 1, cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: 'var(--text-primary)' }}>Next →</button>
                </div>
            )}
        </div>
    );
}
