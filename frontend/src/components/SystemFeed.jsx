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
            <div className="systemFeed__header">
                <span className="systemFeed__title">SYSTEM FEED</span>
                <span className="systemFeed__meta">{isSilent ? "QUIET" : "LIVE"}</span>
            </div>

            {isSilent ? (
                <div className="directive directive--silent">
                    <div className="directive__line1">System stable</div>
                    <div className="directive__line2">No active faults.</div>
                </div>
            ) : (
                <div className="systemFeed__list">
                    {items.map((s) => {
                        const cls = TYPE_CLASS[s.type] || "directive";
                        // Ensure legacy signals have a fallback for detail
                        const title = s.message || "System Alert";
                        const detail = s.detail || (s.type === 'danger' ? "Critical fault detected." : "");

                        return (
                            <div key={s.id} className={cls}>
                                <div className="directive__row">
                                    <span className="directive__dot" />
                                    <div className="directive__stack">
                                        <div className="directive__line1">{title}</div>
                                        {detail && <div className="directive__line2">{detail}</div>}
                                    </div>
                                    <div className="directive__time">{timeAgo(s.timestamp)}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
