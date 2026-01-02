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
                    className="btn-action-meta"
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
                        className="btn-action-primary"
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

            <div style={{ margin: '20px 0', height: '1px', background: 'rgba(255,255,255,0.1)' }} />

            <ProfileImageEditor />
        </div>
    );
}

function ProfileImageEditor() {
    const auth = useGameStore(s => s.auth);
    const updateProfile = useGameStore(s => s.updateProfile); // Assuming this action exists or needs to be used generically?
    // Actually updateDisplayName handles profile/update endpoint, let's check gameStore store to see if we need to modify it or make a new action.
    // For now, I'll assume updateDisplayName is specific. I should probably add a generic 'updateProfile' or modify updateDisplayName to take extra data.
    // Let's implement the UI first, and then I might need to patch gameStore.
    // Wait, let's use a direct fetch or existing action.

    const [imagePreview, setImagePreview] = useState(auth.user?.avatar || null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Size check (max 2MB raw file before compression)
        if (file.size > 2 * 1024 * 1024) {
            setStatus({ type: 'error', msg: 'File too large. Max 2MB.' });
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Resize logic
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 100;
                const MAX_HEIGHT = 100;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG 0.7 quality
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setImagePreview(dataUrl);
                setStatus(null); // Clear errors
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!imagePreview) return;
        setUploading(true);
        setStatus(null);

        // We can reuse the profile update generic endpoint we just modified on backend
        // We'll manually call fetch since gameStore might not have a generic updateProfile action yet.
        try {
            // NOTE: Using window.gameStore actions is safer if available, but let's do direct fetch for now to ensure it works with our new backend changes
            // Actually, we must include the display name or it might get wiped if the backend expects it? 
            // The backend code: `if (newDisplayName) ... updates displayName`. `if (req.body.avatar) ... updates avatar`.
            // So we can send just avatar IF allow missing displayName.
            // But let's look at the backend code again.
            // Backend checks: `if (!newDisplayName) return res.status(400)...`
            // Ah, the backend currently REQUIRES name. I should have made it optional.
            // CRITICAL: The backend requires `newDisplayName`.
            // So I must send the current display name as well.

            const currentName = auth.user?.displayName || auth.user?.handle;

            // We use the store's updateDisplayName if it calls /api/profile/update, but we need to pass extra body args.
            // gameStore probably only sends name.
            // Let's implement a direct fetch here to be safe and robust, mimicking the standard authenticated request.

            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/profile/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.token || ''}`,
                },
                credentials: 'include', // IMPORTANT: Send cookies
                body: JSON.stringify({
                    newDisplayName: currentName,
                    avatar: imagePreview
                })
            });

            const data = await res.json();

            if (data.success) {
                setStatus({ type: 'success', msg: 'Avatar updated!' });
                soundManager.playSuccess();
                // Manually update store state if possible to reflect change immediately?
                // Ideally trigger a sync or re-fetch.
                // For now, let's assume the user can refresh or we hack-update the local state if exposed.
                // We'll use the gameStore.sync() if available or just update auth.user manually.
                useGameStore.setState(state => ({
                    auth: {
                        ...state.auth,
                        user: {
                            ...state.auth.user,
                            avatar: imagePreview
                        }
                    }
                }));
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            console.error(e);
            setStatus({ type: 'error', msg: e.message || 'Upload failed' });
            soundManager.playClick();
        }
        setUploading(false);
    };

    return (
        <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Profile Avatar
            </label>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{
                    width: 64, height: 64,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '2px solid rgba(255,255,255,0.1)',
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {imagePreview ? (
                        <img src={imagePreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.2)' }}>?</span>
                    )}
                </div>

                <div style={{ flex: 1 }}>
                    <label className="btn-action-secondary" style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        fontSize: 13,
                        marginBottom: 8,
                        marginRight: 10
                    }}>
                        Choose Image
                        <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>

                    {imagePreview && imagePreview !== auth.user?.avatar && (
                        <button
                            className="btn-action-primary"
                            onClick={handleUpload}
                            disabled={uploading}
                            style={{
                                padding: '8px 16px',
                                fontSize: 13,
                                borderRadius: 8
                            }}
                        >
                            {uploading ? 'Saving...' : 'Upload'}
                        </button>
                    )}
                </div>
            </div>

            {status && (
                <div style={{
                    fontSize: 12,
                    color: status.type === 'success' ? '#4ade80' : '#ff4d4d',
                    marginTop: 8
                }}>
                    {status.msg}
                </div>
            )}
        </div>
    );
}
