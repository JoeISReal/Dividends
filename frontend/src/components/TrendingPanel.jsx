import React, { useEffect, useState } from 'react';

export function TrendingPanel() {
    const [trending, setTrending] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const res = await fetch('/api/bags/trending');
                const data = await res.json();
                setTrending(data);
                setLoading(false);
            } catch (e) {
                console.error("Trending fetch failed", e);
                setLoading(false);
            }
        };
        fetchTrending();
        const interval = setInterval(fetchTrending, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="panel">
            <div className="panel-title">Trending (Bags)</div>
            <div style={{ minHeight: '140px', overflowY: 'auto' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 4 }}>
                        <div className="skeleton-loader" style={{ height: 24, opacity: 0.8 }} />
                        <div className="skeleton-loader" style={{ height: 24, opacity: 0.6 }} />
                        <div className="skeleton-loader" style={{ height: 24, opacity: 0.4 }} />
                    </div>
                ) : (
                    (!trending || trending.error || !trending.tokens || trending.tokens.length === 0) ? (
                        <div style={{ textAlign: 'center', opacity: 0.7, paddingTop: 20, fontSize: 'var(--text-sm)' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>NO SIGNAL</div>
                            Awaiting market feed...
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                            <tbody>
                                {trending.tokens.slice(0, 5).map((t, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-muted)' }}>
                                        <td style={{ padding: '8px 0', opacity: 0.6 }}>#{idx + 1}</td>
                                        <td style={{ padding: '8px', fontWeight: 600 }}>
                                            {t.symbol}
                                            {t.isVerified && <span style={{ color: '#00dc82', marginLeft: 4, fontSize: '0.8em' }} title="Verified">✓</span>}
                                            {t.tags?.includes('community') && <span style={{ color: '#00dc82', marginLeft: 4, fontSize: '0.8em', opacity: 0.7 }} title="Community">★</span>}
                                        </td>
                                        <td style={{ padding: '8px 0', textAlign: 'right', fontFamily: 'monospace' }}>
                                            <div>{t.priceUsd ? (parseFloat(t.priceUsd) < 0.01 ? `$${parseFloat(t.priceUsd).toFixed(6)}` : `$${parseFloat(t.priceUsd).toFixed(2)}`) : '--'}</div>
                                            {t.organicScore !== undefined && (
                                                <div style={{ fontSize: '0.75em', opacity: 0.7, color: t.organicScore > 80 ? '#00dc82' : '#888' }}>
                                                    Sc: {t.organicScore.toFixed(0)}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                )}
            </div>
        </div>
    );
}
