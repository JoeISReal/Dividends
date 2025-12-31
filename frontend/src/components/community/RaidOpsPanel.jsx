import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../state/gameStore';
import { communityApi } from '../../lib/communityApi';
import { RaidCard } from './RaidCard';
import { soundManager } from '../../game/SoundManager';
import { ConfirmationModal } from '../ConfirmationModal';

export function RaidOpsPanel() {
    const auth = useGameStore(s => s.auth);
    const isStaff = auth.user?.role === 'MOD' || auth.user?.role === 'ADMIN';

    const [activeRaid, setActiveRaid] = useState(null);
    const [recentRaids, setRecentRaids] = useState([]);

    // Modal State
    const [modalConfig, setModalConfig] = useState(null);

    // Create Form State
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        targetUrl: '',
        objective: 'AWARENESS',
        briefing: '',
        suggestedReplies: ['', '', '']
    });

    useEffect(() => {
        loadRaids();
        const interval = setInterval(loadRaids, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const loadRaids = async () => {
        try {
            const active = await communityApi.getActiveRaid();
            const recent = await communityApi.getRecentRaids();
            setActiveRaid(active);
            setRecentRaids(recent || []);
        } catch (e) {
            console.error("Raid Load Failed", e);
        }
    };

    const handleCreate = async () => {
        try {
            // Basic validation
            if (!formData.targetUrl || !formData.briefing) return;

            const payload = {
                ...formData,
                suggestedReplies: formData.suggestedReplies.filter(r => r.trim().length > 0)
            };

            await communityApi.createRaid(payload);
            soundManager.playSuccess();
            setIsCreating(false);
            setFormData({ targetUrl: '', objective: 'AWARENESS', briefing: '', suggestedReplies: ['', '', ''] });
            loadRaids(); // Refresh immediately
        } catch (e) {
            console.error("Create Raid Failed", e);
            soundManager.playError();
            alert(e.message || "Failed to create raid");
        }
    };

    const handleOpenPost = (url) => {
        window.open(url, '_blank');
        communityApi.trackRaid(activeRaid._id, 'open');
        soundManager.playClick();
    };

    const handleCopyReply = (text) => {
        navigator.clipboard.writeText(text);
        communityApi.trackRaid(activeRaid._id, 'selfReport');
        soundManager.playSuccess();
    };

    const handleSelfReport = () => {
        if (!activeRaid) return;

        setModalConfig({
            title: "Confirm Participation",
            message: "Self-reporting affects internal metrics only.\n\n[OK] I interacted with the target post.",
            confirmLabel: "OK",
            onConfirm: () => {
                communityApi.trackRaid(activeRaid._id, 'selfReport');
                soundManager.playSuccess();
                setModalConfig(null);
            },
            onCancel: () => setModalConfig(null)
        });
    };

    const handleAbort = () => {
        setModalConfig({
            title: "ABORT MISSION?",
            message: "This will immediately end the raid for all users.\nAction cannot be undone.",
            confirmLabel: "ABORT",
            isDangerous: true,
            onConfirm: async () => {
                try {
                    await communityApi.cancelRaid(activeRaid._id);
                    soundManager.playSuccess();
                    loadRaids();
                } catch (e) {
                    alert(e.message);
                }
                setModalConfig(null);
            },
            onCancel: () => setModalConfig(null)
        });
    };

    return (
        <div className="raid-ops-panel">
            {modalConfig && <ConfirmationModal {...modalConfig} />}

            <div className="raid-panel-header mission-control-header">
                <span className="raid-panel-title">MISSION CONTROL</span>
                {isStaff && !activeRaid && !isCreating && (
                    <button className="btn-create-raid" onClick={() => setIsCreating(true)}>
                        INITIATE MISSION
                    </button>
                )}
            </div>

            {/* Creation Form (Mod Only) */}
            {isCreating && (
                <div className="raid-create-form" style={{ marginTop: '16px' }}>
                    <div className="form-header">NEW OPERATION</div>
                    <input
                        className="form-input"
                        placeholder="Target URL (X Post)"
                        value={formData.targetUrl}
                        onChange={e => setFormData({ ...formData, targetUrl: e.target.value })}
                    />
                    <select
                        className="form-select"
                        value={formData.objective}
                        onChange={e => setFormData({ ...formData, objective: e.target.value })}
                    >
                        <option value="AWARENESS">AWARENESS</option>
                        <option value="HOLDERS">HOLDERS</option>
                        <option value="CONVERSION">CONVERSION</option>
                        <option value="VOTE">VOTE</option>
                    </select>
                    <textarea
                        className="form-textarea"
                        placeholder="Briefing (max 140)"
                        maxLength={140}
                        value={formData.briefing}
                        onChange={e => setFormData({ ...formData, briefing: e.target.value })}
                    />

                    <div className="form-replies-label" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>suggested responses</div>
                    {formData.suggestedReplies.map((r, i) => (
                        <input
                            key={i}
                            className="form-input"
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                            placeholder={`Option ${i + 1}`}
                            value={r}
                            onChange={e => {
                                const newReplies = [...formData.suggestedReplies];
                                newReplies[i] = e.target.value;
                                setFormData({ ...formData, suggestedReplies: newReplies });
                            }}
                        />
                    ))}

                    <div className="form-actions">
                        <button className="btn-cancel" onClick={() => setIsCreating(false)}>CANCEL</button>
                        <button className="btn-deploy" onClick={handleCreate}>DEPLOY</button>
                    </div>
                </div>
            )}

            {/* Active Raid Card or Idle State */}
            {activeRaid ? (
                <div className="raid-active-section" style={{ marginTop: '16px' }}>
                    <div className="mission-status-badge status-active" style={{ marginBottom: '8px', display: 'inline-block' }}>
                        ACTIVE MISSION
                    </div>
                    <RaidCard
                        raid={activeRaid}
                        onOpen={handleOpenPost}
                        onCopyReply={handleCopyReply}
                        onSelfReport={handleSelfReport}
                        isStaff={isStaff}
                        onCancel={handleAbort}
                    />
                </div>
            ) : (
                !isCreating && (
                    <div className="idle-state-container">
                        <span className="idle-text">STATUS: STANDBY</span>
                        <span className="idle-subtext">MONITORING NETWORK...</span>
                    </div>
                )
            )}

            {/* Recent History */}
            {recentRaids.length > 0 && (
                <div className="raid-recent-section" style={{ marginTop: '24px' }}>
                    <div className="raid-subheader" style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>MISSION LOG</div>
                    <div className="raid-recent-list">
                        {recentRaids.map(r => (
                            <div key={r._id} className="raid-recent-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', borderBottom: '1px dashed var(--border-subtle)' }}>
                                <span className={`status-dot status-${r.status.toLowerCase() !== 'active' ? 'expired' : 'active'}`} style={{ width: '4px', height: '4px', background: 'var(--text-muted)', borderRadius: '50%' }}></span>
                                <span className="raid-recent-obj" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>{r.objective}</span>
                                <span className="raid-recent-time" style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'monospace' }}>
                                    {new Date(r.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
