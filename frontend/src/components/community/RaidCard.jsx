
import React, { useState } from 'react';

/**
 * RaidCard - "Terminal-Style" Raid Op
 * 
 * Props:
 * - raid: Raid object or null
 * - onOpen: (url) => void
 * - onCopyReply: (text) => void
 * - onSelfReport: () => void
 * - isDisabled: boolean (system risk lock)
 */
export function RaidCard({ raid, onOpen, onCopyReply, onSelfReport, isDisabled = false, isStaff = false, onCancel }) {
    const [expandedReplies, setExpandedReplies] = useState(false);
    const [briefingOpen, setBriefingOpen] = useState(true);

    if (!raid) {
        return (
            <div className="raid-card raid-card--empty">
                <div className="raid-header">
                    <span className="raid-status status-inactive">INACTIVE</span>
                    <span className="raid-meta">No active ops</span>
                </div>
                <div className="raid-body">
                    <div className="raid-briefing">
                        Awaiting operator assignment.
                        <br />
                        <span className="text-muted">Stand by for directives.</span>
                    </div>
                </div>
            </div>
        );
    }

    const { targetUrl, objective, briefing, suggestedReplies, expiresAt, status } = raid;
    const isLive = status === 'ACTIVE';

    // Status text
    let statusText = status;
    let statusClass = 'status-inactive';

    if (status === 'ACTIVE') {
        statusClass = 'status-active animate-pulse-slow';
        // Check expiry
        if (new Date(expiresAt) < new Date()) {
            statusText = 'EXPIRED';
            statusClass = 'status-expired';
        }
    } else if (status === 'COOLDOWN') {
        statusText = 'COOLDOWN';
        statusClass = 'status-cooldown';
    }

    const repliesToShow = expandedReplies ? suggestedReplies : suggestedReplies.slice(0, 3);
    const hasMore = suggestedReplies.length > 3;

    return (
        <div className={`raid-card ${isDisabled ? 'raid-card--disabled' : ''}`}>
            {/* Header */}
            <div className="raid-header">
                <div className="raid-status-row">
                    <span className={`raid-status ${statusClass}`}>{statusText}</span>
                    <span className="raid-objective">{objective}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isStaff && isLive && (
                        <button
                            className="btn-text-xs text-red"
                            onClick={onCancel}
                            style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}
                        >
                            [ABORT]
                        </button>
                    )}
                    <div className="raid-timer">
                        Expires: {new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            {/* Briefing */}
            <div className="raid-section">
                <div className="raid-label-row" onClick={() => setBriefingOpen(!briefingOpen)}>
                    <span className="raid-label">BRIEFING</span>
                    <span className="raid-toggle">{briefingOpen ? '[-]' : '[+]'}</span>
                </div>
                {briefingOpen && (
                    <div className="raid-briefing-text">
                        {briefing}
                    </div>
                )}
            </div>

            {/* Target Actions */}
            <div className="raid-actions">
                <button
                    className="btn-raid-primary"
                    onClick={() => onOpen(targetUrl)}
                    disabled={isDisabled}
                >
                    OPEN POST
                </button>
                <button
                    className="btn-raid-secondary"
                    onClick={onSelfReport}
                    disabled={isDisabled}
                >
                    SELF-REPORT
                </button>
            </div>

            {/* Suggested Replies */}
            {suggestedReplies && suggestedReplies.length > 0 && (
                <div className="raid-section">
                    <span className="raid-label">SUGGESTED REPLIES</span>
                    <div className="raid-replies">
                        {repliesToShow.map((reply, i) => (
                            <div key={i} className="raid-reply-row">
                                <span className="raid-reply-text">"{reply}"</span>
                                <button
                                    className="btn-copy-sm"
                                    onClick={() => onCopyReply(reply)}
                                    disabled={isDisabled}
                                    title="Copy"
                                >
                                    CPY
                                </button>
                            </div>
                        ))}
                    </div>
                    {hasMore && (
                        <button
                            className="btn-text-xs"
                            onClick={() => setExpandedReplies(!expandedReplies)}
                        >
                            {expandedReplies ? 'View Less' : `View All (${suggestedReplies.length})`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
