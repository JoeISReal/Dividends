
import React, { useEffect, useState } from 'react';

export function EcosystemMoodPanel() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/ecosystem/mood')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch mood:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div style={{ padding: 'var(--space-3)', color: 'var(--text-secondary)', fontSize: '12px' }}>Loading Status...</div>;
    if (!data) return null;

    const { mood, tags, updatedAt } = data;

    const getMoodColor = (m) => {
        switch (m) {
            case 'QUIET': return '#aaa';
            case 'ACTIVE': return '#4caf50';
            case 'HEATED': return '#ff9800';
            case 'EUPHORIC': return '#f44336';
            default: return '#fff';
        }
    };

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return '1d+ ago';
    };

    const moodColor = getMoodColor(mood);

    return (
        <div className="surface-hud surface-subordinate" style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)'
                }}>
                    Ecosystem Status
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    {timeAgo(updatedAt)}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    color: moodColor,
                    textShadow: `0 0 10px ${moodColor}40`
                }}>
                    {mood}
                </div>

                {/* Micro-Viz: Mood Bar */}
                <div style={{ display: 'flex', gap: '2px' }}>
                    {[...Array(5)].map((_, i) => {
                        const active = (
                            (mood === 'QUIET' && i < 1) ||
                            (mood === 'ACTIVE' && i < 3) ||
                            (mood === 'HEATED' && i < 4) ||
                            (mood === 'EUPHORIC' && i < 5)
                        );
                        return (
                            <div key={i} style={{
                                width: '4px',
                                height: '12px',
                                borderRadius: '1px',
                                background: active ? moodColor : 'rgba(255,255,255,0.1)',
                                boxShadow: active ? `0 0 5px ${moodColor}60` : 'none'
                            }} />
                        );
                    })}
                </div>
            </div>

            {tags && tags.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {tags.map(tag => (
                        <span key={tag} style={{
                            fontSize: '9px',
                            padding: '2px 6px',
                            background: `${moodColor}15`,
                            color: moodColor,
                            border: `1px solid ${moodColor}30`,
                            borderRadius: '4px',
                            fontWeight: 600
                        }}>
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
