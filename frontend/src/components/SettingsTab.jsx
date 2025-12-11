import React, { useState } from 'react';
import { soundManager } from '../game/SoundManager';
import { useGameStore } from '../state/gameStore';

export default function SettingsTab() {
    // Initialize with current global volume
    const [volume, setVolume] = useState(soundManager.getVolume());
    const logout = useGameStore(s => s.logout);

    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        soundManager.setVolume(val);
    };

    const handleTestSound = () => {
        soundManager.playSuccess();
    };

    const handleLogout = () => {
        soundManager.playClick();
        if (window.solana && window.solana.disconnect) {
            window.solana.disconnect();
        }
        logout();
    };

    return (
        <div style={{ padding: 20, color: '#fff' }}>
            <div className="main-header">
                <div className="main-title">⚙️ Settings</div>
            </div>

            <div style={{
                background: 'rgba(255,255,255,0.05)',
                padding: 24,
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: 20 }}>Audio Settings</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                    <span style={{ minWidth: 80, fontWeight: 600 }}>Master Volume</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={handleVolumeChange}
                        style={{
                            flex: 1,
                            accentColor: '#AB9FF2',
                            height: 6,
                            cursor: 'pointer'
                        }}
                    />
                    <span style={{ minWidth: 40, textAlign: 'right', fontFamily: 'monospace' }}>
                        {Math.round(volume * 100)}%
                    </span>
                </div>
            </div>

            <div style={{
                marginTop: 20,
                background: 'rgba(171, 159, 242, 0.05)',
                padding: 24,
                borderRadius: 16,
                border: '1px solid rgba(171, 159, 242, 0.2)'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: 20, color: '#AB9FF2' }}>Profile Settings</h3>
                <DisplayNameEditor />
            </div>

            <div style={{
                marginTop: 20,
                background: 'rgba(255, 59, 48, 0.05)',
                padding: 24,
                borderRadius: 16,
                border: '1px solid rgba(255, 59, 48, 0.2)'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: 10, color: '#ff453a' }}>Account</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
                    Disconnecting will return you to the login screen. Your stats and upgrades are saved to your wallet address.
                </p>
                <button
                    className="btn-secondary"
                    onClick={handleLogout}
                    style={{
                        padding: '10px 20px',
                        border: '1px solid #ff453a',
                        color: '#ff453a',
                        width: '100%',
                        fontWeight: 700,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 8
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    ⏻ Disconnect Wallet
                </button>
            </div>
        </div>
    );
}

function DisplayNameEditor() {
    const auth = useGameStore(s => s.auth);
    const updateDisplayName = useGameStore(s => s.updateDisplayName);

    // Initial state: User's display name or handle
    const [name, setName] = useState(auth.user?.displayName || '');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success'|'error', msg: '' }

    const handleSave = async () => {
        if (!name.trim()) return;
        setLoading(true);
        setStatus(null);

        const result = await updateDisplayName(name);

        if (result.success) {
            setStatus({ type: 'success', msg: 'Name updated successfully!' });
            soundManager.playSuccess();
        } else {
            setStatus({ type: 'error', msg: result.error || 'Failed to update name.' });
            soundManager.playError();
        }
        setLoading(false);
    };

    return (
        <div>
            <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Display Name (Unique)
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter new name..."
                        maxLength={20}
                        style={{
                            flex: 1,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            padding: '10px 14px',
                            color: '#fff',
                            fontSize: 14
                        }}
                    />
                    <button
                        className="btn-primary"
                        onClick={handleSave}
                        disabled={loading || name === auth.user?.displayName}
                        style={{
                            padding: '10px 20px',
                            fontSize: 14,
                            opacity: (loading || name === auth.user?.displayName) ? 0.5 : 1,
                            minWidth: 80,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {loading ? '...' : 'Save'}
                    </button>
                </div>
            </div>

            {status && (
                <div style={{
                    fontSize: 13,
                    color: status.type === 'success' ? '#4ade80' : '#ff4d4d',
                    padding: '8px 12px',
                    background: status.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 77, 77, 0.1)',
                    borderRadius: 8,
                    marginTop: 10
                }}>
                    {status.msg}
                </div>
            )}

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                Wallet ID: <span style={{ fontFamily: 'monospace' }}>{auth.user?.handle}</span>
            </div>
        </div>
    );
}
