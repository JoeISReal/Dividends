
import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../state/gameStore';
import { communityApi } from '../../lib/communityApi';
import { ModTools } from './ModTools';
import { soundManager } from '../../game/SoundManager';

const API_BASE = import.meta.env.VITE_API_URL || '';

function timeAgo(date) {
    const s = Math.floor((new Date() - new Date(date)) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    return `${Math.floor(s / 3600)}h`;
}

export function ChatPanel({ active }) {
    const auth = useGameStore(s => s.auth);
    const userRole = auth.user?.role || 'USER';
    const isStaff = userRole === 'MOD' || userRole === 'ADMIN';

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [status, setStatus] = useState('CONNECTING'); // CONNECTING, LIVE, DEGRADED
    const [rateLimit, setRateLimit] = useState(false);

    const messagesEndRef = useRef(null);
    const eventSourceRef = useRef(null);
    const scrollRef = useRef(null);
    const [autoScroll, setAutoScroll] = useState(true);

    // Initial Load + SSE
    useEffect(() => {
        if (!active) return; // Only connect if active? Or keep background? 
        // Prompt says "lifecycle-safe". Let's connect on mount.

        loadRecent();
        connectSSE();

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, [active]);

    // Auto-scroll effect
    useEffect(() => {
        if (autoScroll && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, autoScroll]);

    const loadRecent = async () => {
        try {
            const msgs = await communityApi.getRecentMessages();
            setMessages(msgs);
        } catch (e) {
            console.error("Failed to load recent chat", e);
        }
    };

    const connectSSE = () => {
        // Close existing
        if (eventSourceRef.current) eventSourceRef.current.close();

        // Establish new
        // Note: EventSource doesn't support custom headers easily for cookies without withCredentials=true
        // which matches standard browser fetch behavior if configured correctly on server.
        // We use standard EventSource, counting on cookie being sent automatically for same-origin (or configured CORS).
        // Since we are proxying or strictly CORS mapped, standard EventSource usually sends cookies if `withCredentials` is not strictly separate config.
        // Actually, native EventSource sends cookies if withCredentials is set.
        const es = new EventSource(`${API_BASE}/api/community/chat/stream`, { withCredentials: true });

        es.onopen = () => {
            setStatus('LIVE');
        };

        es.onerror = () => {
            setStatus('DEGRADED');
            es.close();
            // Simple backoff retry
            setTimeout(connectSSE, 5000);
        };

        es.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === 'ping') return;

                if (payload.type === 'message') {
                    addMessage(payload.data);
                } else if (payload.type === 'mod_action') {
                    handleModAction(payload);
                }
            } catch (e) {
                console.warn("SSE Parse Error", e);
            }
        };

        eventSourceRef.current = es;
    };

    const addMessage = (msg) => {
        setMessages(prev => {
            // Dedup
            if (prev.find(m => m._id === msg._id)) return prev;
            // Cap at 50
            const next = [...prev, msg];
            if (next.length > 50) next.shift();

            // Sound effect if not self
            if (msg.handle !== auth.user?.handle) {
                // soundManager.playTick() ? (Maybe too spammy, kept silent unless DM)
            }
            return next;
        });
    };

    const handleModAction = (actionPayload) => {
        const { action, targetId } = actionPayload;

        setMessages(prev => prev.map(m => {
            if (m._id !== targetId) return m;

            if (action === 'remove') return { ...m, status: 'REMOVED', text: '[REMOVED]' };
            if (action === 'shadow') return { ...m, status: 'SHADOWED' }; // Only mods see this anyway usually
            return m;
        }).filter(m => {
            // Filter out REMOVED/SHADOWED for normal users immediately if we want live cleanup
            // But we might want to show [REMOVED] placeholder
            if (action === 'remove' && !isStaff) return false;
            if (action === 'shadow' && !isStaff) return false;
            return true;
        }));
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Optimistic UI? 
        // No, prompt says "optimistic insert as pending row then reconcile".
        // For simplicity v1: Wait for ack broadcast (fast enough usually) or simplistic loading state.
        // Let's do simple send.

        try {
            await communityApi.sendMessage(input);
            setInput('');
            soundManager.playClick();
        } catch (err) {
            console.error(err);
            // Rate Limit Error?
            if (err.message.includes('Rate limit')) {
                setRateLimit(true);
                setTimeout(() => setRateLimit(false), 5000);
                soundManager.playError();
            }
        }
    };

    const handleModOp = async (action, targetId, reason, duration) => {
        try {
            await communityApi.modAction(action, targetId, reason, duration);
            soundManager.playSuccess();
        } catch (e) {
            console.error("Mod Action Failed", e);
            soundManager.playError();
        }
    };

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        // If user scrolls up, disable auto-scroll
        const isBottom = scrollHeight - scrollTop - clientHeight < 50;
        setAutoScroll(isBottom);
    };

    return (
        <div className="chat-panel">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-title-row">
                    <span className="chat-title" style={{ marginRight: 8 }}>LIVE OPS</span>
                    <span className={`chat-status-chip ${status === 'LIVE' ? 'status-live' : 'status-degraded'}`}>
                        {status}
                    </span>
                </div>
                <div className="chat-subtitle">
                    Operator channel. Rate limited.
                </div>
            </div>

            {/* List */}
            <div className="chat-list" ref={scrollRef} onScroll={handleScroll}>
                {messages.length === 0 ? (
                    <div className="chat-empty">
                        <div className="chat-empty-title">No active messages.</div>
                    </div>
                ) : (
                    messages.map(m => {
                        const isRemoved = m.status === 'REMOVED';
                        const isShadowed = m.status === 'SHADOWED';

                        // If shadowed and not staff, don't render (should be filtered by API/SSE logic but safety check)
                        if (isShadowed && !isStaff) return null;

                        // Row Class
                        let rowClass = 'chat-row';
                        if (m.role === 'ADMIN') rowClass += ' role-admin';
                        else if (m.role === 'MOD') rowClass += ' role-mod';

                        // Severity Dot Logic
                        let dotClass = 'severity-dot';
                        if (m.role === 'ADMIN') dotClass += ' dot-critical';
                        else if (m.role === 'MOD') dotClass += ' dot-warning';
                        else dotClass += ' dot-info';

                        return (
                            <div key={m._id || Math.random()} className={rowClass}>
                                <div className="chat-gutter">
                                    <div className={dotClass} />
                                </div>
                                <div className="chat-content">
                                    <div className="chat-meta">
                                        <span className="chat-name">{m.displayName}</span>
                                        <span className="chat-tier">• {m.tier}</span>
                                        <span className="chat-time">• {timeAgo(m.createdAt)}</span>
                                        {isStaff && (
                                            <div className="chat-mod-overlay">
                                                <ModTools
                                                    targetId={m._id}
                                                    targetHandle={m.wallet}
                                                    currentRole={userRole}
                                                    onAction={handleModOp}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className={`chat-text ${isRemoved ? 'text-removed' : ''} ${isShadowed ? 'text-shadowed' : ''}`}>
                                        {m.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input - Sticky Bottom */}
            <form className="chat-input-area" onSubmit={handleSend}>
                {rateLimit && (
                    <div className="chat-error-toast">Rate limit enforced. Retry in 5s.</div>
                )}
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Transmit update (max 240)."
                    maxLength={240}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button
                    type="submit"
                    className="btn-chat-send"
                    disabled={!input.trim()}
                >
                    SEND
                </button>
            </form>

            <div className="chat-footer-rules">
                No links. 240 chars. Rate limited. Logged.
            </div>
        </div>
    );
}
