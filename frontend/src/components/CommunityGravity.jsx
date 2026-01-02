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

    // Rank helper for visuals
    const getRankStyle = (rank) => {
        if (rank <= 3) return {
            bg: 'rgba(255, 255, 255, 0.03)',
            accent: 'var(--accent-gold)',
            opacity: 1,
            padding: '16px', // Taller
            border: '1px solid rgba(255,255,255,0.05)'
        };
        if (rank <= 10) return {
            bg: 'transparent',
            accent: 'var(--text-primary)',
            opacity: 0.9,
            padding: '12px', // Standard
            border: 'none'
        };
        return {
            bg: 'transparent',
            accent: 'var(--text-muted)',
            opacity: 0.6, // Muted
            padding: '8px', // Compact
            border: 'none'
        };
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Header: Clean & authoritative */}
            <div style={{
                marginBottom: '16px', // Increased spacing
                paddingLeft: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
            }}>
                <span className="text-label" style={{ letterSpacing: '0.15em' }}>GRAVITY WELL</span>
                <span className="text-label" style={{ fontSize: '10px', opacity: 0.5 }}>
                    TOP {holders.length}
                </span>
            </div>

            {/* List Container */}
            <div className="surface-secondary" style={{
                flex: 1,
                overflowY: 'auto',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                padding: '0',
                background: 'rgba(0,0,0,0.2)' // Slightly darker well background
            }}>
                {holders.length === 0 ? (
                    <div className="p-4 text-center text-muted text-xs">No gravity data detected.</div>
                ) : (
                    holders.map((h) => {
                        const style = getRankStyle(h.rank);
                        const isTop = h.rank <= 3;

                        return (
                            <div key={h.wallet || h.rank} style={{
                                display: 'grid',
                                gridTemplateColumns: '40px 1fr auto', // Increased rank column width
                                gap: '12px',
                                alignItems: 'center',
                                padding: style.padding,
                                borderBottom: '1px solid var(--border-subtle)',
                                background: style.bg,
                                opacity: style.opacity,
                                minHeight: isTop ? '56px' : 'auto',
                                borderLeft: isTop ? `2px solid ${style.accent}` : '2px solid transparent' // Subtle accent marker
                            }}>
                                {/* Rank */}
                                <div className="text-value" style={{
                                    color: style.accent,
                                    fontSize: isTop ? '16px' : '13px',
                                    fontWeight: isTop ? 700 : 500
                                }}>
                                    #{h.rank}
                                </div>

                                {/* Wallet / Entity - Primary Information */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className="text-value" style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: isTop ? '15px' : '13px',
                                        color: isTop ? 'var(--text-primary)' : 'var(--text-secondary)'
                                    }}>
                                        {h.displayWallet}
                                    </span>
                                </div>

                                {/* Tier & Share - Secondary */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {h.share && (
                                        <span style={{
                                            fontSize: '11px',
                                            color: 'var(--text-muted)',
                                            fontFamily: 'var(--font-mono)',
                                            opacity: isTop ? 0.8 : 0.5
                                        }}>
                                            {h.share.toFixed(2)}%
                                        </span>
                                    )}
                                    {/* Tier Badge scaled down slightly to not compete */}
                                    <div style={{ transform: 'scale(0.9)', transformOrigin: 'right center' }}>
                                        <TierBadge tier={h.tier} size="xs" showName={false} />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* FOOTER: Muted Metadata */}
            <div style={{
                marginTop: '12px',
                padding: '0 4px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '9px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                opacity: 0.4 // Very low visual weight
            }}>
                <span>SOURCE · SNAPSHOT</span>
                <span>LAST UPDATED · {formattedDate}</span>
            </div>
        </div >
    );
}
