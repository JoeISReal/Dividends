
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

    if (loading) return <div style={styles.container}>Loading Status...</div>;
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

    return (
        <div style={styles.container}>
            <div style={styles.header}>ECOSYSTEM STATUS</div>
            <div style={{ ...styles.mood, color: getMoodColor(mood) }}>
                {mood}
            </div>
            {tags && tags.length > 0 && (
                <div style={styles.tags}>
                    {tags.map(tag => (
                        <span key={tag} style={styles.tag}>{tag}</span>
                    ))}
                </div>
            )}
            <div style={styles.meta}>
                Updated: {timeAgo(updatedAt)}
            </div>
        </div>
    );
}

const styles = {
    container: {
        marginTop: '40px',
        padding: '15px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace'
    },
    header: {
        color: '#666',
        marginBottom: '5px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    mood: {
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '5px'
    },
    tags: {
        marginBottom: '8px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px'
    },
    tag: {
        background: 'rgba(255,255,255,0.1)',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '10px'
    },
    meta: {
        color: '#555',
        fontSize: '10px'
    }
};
