// frontend/src/components/SystemFeed.jsx
import React, { useMemo } from "react";
import { useGameStore } from "../state/gameStore";
import "./SystemFeed.css";

const TYPE_CLASS = {
    info: "directive directive--info",
    warning: "directive directive--warning",
    success: "directive directive--success",
    critical: "directive directive--critical",
    danger: "directive directive--critical", // Legacy mapping
};

function timeAgo(ts) {
    const d = Date.now() - (ts || 0);
    if (d < 5_000) return "now";
    if (d < 60_000) return `${Math.floor(d / 1000)}s`;
    if (d < 3_600_000) return `${Math.floor(d / 60_000)}m`;
    return `${Math.floor(d / 3_600_000)}h`;
}

export function SystemFeed({ limit = 4 }) {
    const signals = useGameStore((s) => s.signals || []);

    const items = useMemo(() => {
        // Prefer directive signals first, then others, most-recent-first.
        const sorted = [...signals].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        const sliced = sorted.slice(0, limit);
        return sliced;
    }, [signals, limit]);

    const isSilent = items.length === 0;

    return (
        <div className="systemFeed">
            <div className="systemFeed__header" style={{ border: 'none', background: 'transparent', padding: '0 0 8px 0' }}>
                <span className="systemFeed__title" style={{ fontSize: '10px' }}>DIRECTIVE FEED</span>
                <span className="systemFeed__meta" style={{ fontSize: '10px', opacity: 0.5 }}>{isSilent ? "SILENT" : "ACTIVE"}</span>
            </div>

            {isSilent ? (
                <div className="directive directive--silent" style={{
                    border: '1px dashed rgba(255,255,255,0.1)',
                    background: 'transparent',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: 0.5
                }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }}></div>
                    <div className="directive__line1" style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>
                        System stable — active monitoring
                    </div>
                </div>
            ) : (
                <div className="systemFeed__list" style={{ gap: '8px' }}>
                    {items.map((s, index) => {
                        const cls = TYPE_CLASS[s.type] || "directive";
                        const title = s.message || "System Alert";
                        const detail = s.detail;

                        // Opacity decay for older items in the stack
                        const opacity = 1 - (index * 0.25);

                        return (
                            <div key={s.id} className={cls} style={{
                                opacity: opacity,
                                borderLeft: `3px solid ${s.type === 'critical' ? 'var(--accent-red)' : 'rgba(255,255,255,0.2)'}`,
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '4px',
                                padding: '8px 12px'
                            }}>
                                <div className="directive__row" style={{ gridTemplateColumns: '1fr auto', gap: '4px' }}>
                                    <div className="directive__stack">
                                        <div className="directive__line1" style={{ fontSize: '12px' }}>{title}</div>
                                        {detail && <div className="directive__line2" style={{ fontSize: '11px', opacity: 0.7 }}>{detail}</div>}
                                    </div>
                                    <div className="directive__time" style={{ fontSize: '9px', opacity: 0.4 }}>{timeAgo(s.timestamp)}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
