import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../state/gameStore';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AdminPanel() {
    const auth = useGameStore(s => s.auth);
    const [users, setUsers] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [auditLog, setAuditLog] = useState([]);
    const [showAuditLog, setShowAuditLog] = useState(false);

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

            console.log('[AdminPanel] Fetching users:', { page, search: searchQuery, url: `${API_BASE}/api/admin/users?${params}` });

            const res = await fetch(`${API_BASE}/api/admin/users?${params}`, {
                credentials: 'include'
            });

            console.log('[AdminPanel] Response status:', res.status, res.statusText);

            if (res.ok) {
                const data = await res.json();
                console.log('[AdminPanel] Users data:', data);
                setUsers(data.users || []);
                setPagination(data.pagination);
            } else {
                const errorText = await res.text();
                console.error("[AdminPanel] Failed to fetch users:", res.status, errorText);
            }
        } catch (e) {
            console.error("[AdminPanel] Fetch users error:", e);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, pagination.limit]);

    // Fetch audit log
    const fetchAuditLog = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/audit-log?limit=50`, {
                credentials: 'include'
            });

            if (res.ok) {
                const data = await res.json();
                setAuditLog(data);
            }
        } catch (e) {
            console.error("Fetch audit log error:", e);
        }
    };

    // Set user role
    const setUserRole = async (handle, role, displayName) => {
        if (!confirm(`Change ${displayName || handle.slice(0, 8)} to ${role} role?`)) return;

        try {
            const res = await fetch(`${API_BASE}/api/admin/users/set-role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ handle, role })
            });

            if (res.ok) {
                fetchUsers(pagination.page);
                alert(`✅ ${displayName || handle.slice(0, 8)} is now ${role}`);
            } else {
                const error = await res.json();
                alert(`❌ Error: ${error.error}`);
            }
        } catch (e) {
            console.error("Set role error:", e);
            alert("❌ Failed to set role");
        }
    };

    useEffect(() => {
        if (!showAuditLog) {
            fetchUsers(1);
        }
    }, [searchQuery, showAuditLog, fetchUsers]);

    useEffect(() => {
        if (showAuditLog) {
            fetchAuditLog();
        }
    }, [showAuditLog]);

    // Only show to ADMIN users (NOT MOD)
    if (auth.user?.role !== 'ADMIN') {
        return null;
    }

    const getRoleBadgeStyle = (role) => {
        if (role === 'ADMIN') return {
            bg: 'rgba(255,59,48,0.15)',
            border: '1px solid rgba(255,59,48,0.3)',
            color: '#ff453a'
        };
        if (role === 'MOD') return {
            bg: 'rgba(255,165,0,0.15)',
            border: '1px solid rgba(255,165,0,0.3)',
            color: '#ff9f0a'
        };
        return {
            bg: 'rgba(100,100,100,0.15)',
            border: '1px solid rgba(100,100,100,0.3)',
            color: '#8e8e93'
        };
    };

    return (
        <div style={{
            marginTop: '32px',
            paddingTop: '32px',
            borderTop: '2px solid var(--border-subtle)'
        }}>
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                    fontSize: '16px',
                    marginBottom: '8px',
                    color: '#ff453a',
                    fontWeight: 700,
                    letterSpacing: '0.5px'
                }}>🛡️ ADMIN PANEL</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Manage user roles and view moderation activity
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button
                    className={!showAuditLog ? 'btn-action-primary' : 'surface-secondary'}
                    onClick={() => setShowAuditLog(false)}
                    style={{
                        padding: '10px 20px',
                        fontSize: '13px',
                        fontWeight: 600,
                        flex: 1
                    }}
                >
                    👥 USER MANAGEMENT
                </button>
                <button
                    className={showAuditLog ? 'btn-action-primary' : 'surface-secondary'}
                    onClick={() => setShowAuditLog(true)}
                    style={{
                        padding: '10px 20px',
                        fontSize: '13px',
                        fontWeight: 600,
                        flex: 1
                    }}
                >
                    📋 AUDIT LOG
                </button>
            </div>

            {!showAuditLog ? (
                <>
                    {/* Search */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="🔍 Search by wallet address or display name..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    paddingRight: searchInput ? '80px' : '16px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '8px',
                                    color: 'var(--text-primary)',
                                    fontSize: '14px'
                                }}
                            />
                            {searchInput && (
                                <button
                                    onClick={() => setSearchInput('')}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        padding: '6px 12px',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: '4px',
                                        color: 'var(--text-muted)',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        {searchInput && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                Searching for "{searchInput}"...
                            </div>
                        )}
                    </div>

                    {/* Users List */}
                    {loading ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: 'var(--text-muted)',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '12px'
                        }}>
                            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                            <div>Loading users...</div>
                        </div>
                    ) : users.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: 'var(--text-muted)',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '12px'
                        }}>
                            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                            <div>No users found</div>
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                Showing {users.length} of {pagination.total} users
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {users.map((user) => {
                                    const roleStyle = getRoleBadgeStyle(user.role);
                                    return (
                                        <div key={user.handle} style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid var(--border-subtle)',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px'
                                        }}>
                                            {/* User Info Row */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{
                                                        fontSize: '15px',
                                                        color: 'var(--text-primary)',
                                                        fontWeight: 600,
                                                        marginBottom: '6px'
                                                    }}>
                                                        {user.displayName || 'Anonymous'}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: 'var(--text-muted)',
                                                        fontFamily: 'var(--font-mono)',
                                                        marginBottom: '8px'
                                                    }}>
                                                        {user.handle.slice(0, 12)}...{user.handle.slice(-8)}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '11px',
                                                        color: 'var(--text-muted)',
                                                        display: 'flex',
                                                        gap: '12px'
                                                    }}>
                                                        <span>Tier: {user.holderTier || 'OBSERVER'}</span>
                                                        <span>•</span>
                                                        <span>Level {user.level || 1}</span>
                                                        <span>•</span>
                                                        <span>{(user.lifetimeYield || 0).toFixed(0)} DVD</span>
                                                    </div>
                                                </div>

                                                {/* Current Role Badge */}
                                                <div style={{
                                                    padding: '6px 14px',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    ...roleStyle
                                                }}>
                                                    {user.role || 'USER'}
                                                </div>
                                            </div>

                                            {/* Role Actions */}
                                            <div style={{
                                                display: 'flex',
                                                gap: '8px',
                                                paddingTop: '12px',
                                                borderTop: '1px solid var(--border-subtle)'
                                            }}>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: 'auto', paddingTop: '8px' }}>
                                                    Change role:
                                                </div>
                                                {user.role !== 'USER' && (
                                                    <button
                                                        onClick={() => setUserRole(user.handle, 'USER', user.displayName)}
                                                        style={{
                                                            padding: '8px 16px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            background: 'rgba(100,100,100,0.1)',
                                                            border: '1px solid rgba(100,100,100,0.3)',
                                                            borderRadius: '6px',
                                                            color: '#8e8e93',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        → USER
                                                    </button>
                                                )}
                                                {user.role !== 'MOD' && (
                                                    <button
                                                        onClick={() => setUserRole(user.handle, 'MOD', user.displayName)}
                                                        style={{
                                                            padding: '8px 16px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            background: 'rgba(255,165,0,0.1)',
                                                            border: '1px solid rgba(255,165,0,0.3)',
                                                            borderRadius: '6px',
                                                            color: '#ff9f0a',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        → MOD
                                                    </button>
                                                )}
                                                {user.role !== 'ADMIN' && (
                                                    <button
                                                        onClick={() => setUserRole(user.handle, 'ADMIN', user.displayName)}
                                                        style={{
                                                            padding: '8px 16px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            background: 'rgba(255,59,48,0.1)',
                                                            border: '1px solid rgba(255,59,48,0.3)',
                                                            borderRadius: '6px',
                                                            color: '#ff453a',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        → ADMIN
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    marginTop: '24px',
                                    alignItems: 'center'
                                }}>
                                    <button
                                        onClick={() => fetchUsers(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="surface-secondary"
                                        style={{
                                            padding: '10px 20px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            opacity: pagination.page === 1 ? 0.5 : 1,
                                            cursor: pagination.page === 1 ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        ← Previous
                                    </button>
                                    <span style={{
                                        padding: '10px 16px',
                                        fontSize: '13px',
                                        color: 'var(--text-primary)',
                                        fontWeight: 600
                                    }}>
                                        Page {pagination.page} of {pagination.pages}
                                    </span>
                                    <button
                                        onClick={() => fetchUsers(pagination.page + 1)}
                                        disabled={pagination.page === pagination.pages}
                                        className="surface-secondary"
                                        style={{
                                            padding: '10px 20px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            opacity: pagination.page === pagination.pages ? 0.5 : 1,
                                            cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </>
            ) : (
                <>
                    {/* Audit Log */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-subtle)',
                        maxHeight: '600px',
                        overflowY: 'auto'
                    }}>
                        {auditLog.length === 0 ? (
                            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
                                <div>No audit log entries yet</div>
                            </div>
                        ) : (
                            auditLog.map((log, idx) => (
                                <div key={idx} style={{
                                    padding: '16px',
                                    borderBottom: idx < auditLog.length - 1 ? '1px solid var(--border-subtle)' : 'none'
                                }}>
                                    <div style={{
                                        fontSize: '11px',
                                        color: 'var(--text-muted)',
                                        marginBottom: '6px',
                                        fontFamily: 'var(--font-mono)'
                                    }}>
                                        {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                        <strong style={{ color: '#ff9f0a' }}>{log.action}</strong>
                                        {' '}by{' '}
                                        <span style={{ fontFamily: 'var(--font-mono)' }}>
                                            {(log.admin || log.mod)?.slice(0, 8)}
                                        </span>
                                        {log.target && (
                                            <>
                                                {' '}→{' '}
                                                <span style={{ fontFamily: 'var(--font-mono)' }}>
                                                    {log.target.slice(0, 8)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    {log.details && (
                                        <div style={{
                                            fontSize: '11px',
                                            color: 'var(--text-muted)',
                                            marginTop: '6px',
                                            background: 'rgba(0,0,0,0.2)',
                                            padding: '6px 10px',
                                            borderRadius: '4px',
                                            fontFamily: 'var(--font-mono)'
                                        }}>
                                            {JSON.stringify(log.details)}
                                        </div>
                                    )}
                                    {log.reason && (
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                            Reason: {log.reason}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
