import React, { useEffect, useState } from 'react';
import { TierBadge } from './TierBadge';

export default function CommunityGravity() {
    const [data, setData] = useState({ holders: [], updatedAt: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        console.log("CommunityGravity: Mounting v3.0 (API Mode)");

        const fetchData = async () => {
            try {
                // Use the dedicated bags endpoint for rich rankings
                const res = await fetch('/api/bags/token/top-holders');
                if (!res.ok) throw new Error(`API Error: ${res.status}`);

                const json = await res.json();

                if (mounted) {
                    // Handle both old array format (fallback) and new object format
                    const holdersList = Array.isArray(json) ? json : (json.holders || []);
                    const updatedAt = Array.isArray(json) ? null : json.updatedAt;

                    // Enrich with display wallet if needed (though backend might send full wallet)
                    const enriched = holdersList.map((h, i) => ({
                        ...h,
                        rank: i + 1, // Ensure rank is explicit
                        displayWallet: h.username || (h.wallet ? `${h.wallet.slice(0, 4)}...${h.wallet.slice(-4)}` : 'Unknown')
                    }));

                    setData({
                        holders: enriched,
                        updatedAt: updatedAt
                    });
                    setLoading(false);
                }
            } catch (e) {
                console.error("Gravity Well Fetch Error:", e);
                if (mounted) {
                    setError(e.message);
                    setLoading(false);
                }
            }
        };

        fetchData();
        return () => { mounted = false; };
    }, []);

    if (loading) return <div className="p-4 text-xs text-muted">Loading Gravity Well...</div>;
    if (error) return <div className="p-4 text-xs text-red-400">Error loading gravity data.</div>;

    const { holders, updatedAt } = data;

    // formatting the date
    const formattedDate = updatedAt
        ? new Date(updatedAt).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
        })
        : 'Recently';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{
                marginBottom: '12px',
                paddingLeft: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
            }}>
                <span className="text-label">GRAVITY WELL</span>
                <span className="text-label" style={{ fontSize: '10px', opacity: 0.5 }}>
                    TOP {holders.length}
                </span>
            </div>

            <div className="surface-secondary" style={{
                flex: 1,
                overflowY: 'auto',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                padding: '0'
            }}>
                {holders.length === 0 ? (
                    <div className="p-4 text-center text-muted text-xs">No data available</div>
                ) : (
                    holders.map((h) => (
                        <div key={h.wallet || h.rank} style={{
                            display: 'grid',
                            gridTemplateColumns: '30px 1fr auto',
                            gap: '12px',
                            alignItems: 'center',
                            padding: h.rank <= 3 ? '12px 16px' : '8px 16px',
                            borderBottom: '1px solid var(--border-subtle)',
                            background: h.rank <= 3 ? 'rgba(255,255,255,0.02)' : 'transparent',
                            fontSize: '13px'
                        }}>
                            <div className="text-value" style={{ color: h.rank <= 3 ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                                #{h.rank}
                            </div>
                            <div className="text-value" style={{ fontFamily: 'var(--font-mono)', opacity: 0.9 }}>
                                {h.displayWallet}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                                {/* Optional: Show Share % if available */}
                                {h.share && (
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                        {h.share.toFixed(2)}%
                                    </span>
                                )}
                                <TierBadge tier={h.tier} size="xs" showName={true} />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* FOOTER: Authority Signal */}
            <div style={{
                marginTop: '8px',
                padding: '0 4px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '9px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
            }}>
                <span>SOURCE · SNAPSHOT</span>
                <span>UPDATED · {formattedDate}</span>
            </div>
        </div >
    );
}
