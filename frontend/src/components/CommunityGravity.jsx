import React, { useEffect, useState } from 'react';
import { TierBadge } from './TierBadge';

export default function CommunityGravity() {
    const [holders, setHolders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetchHolders = async () => {
            try {
                // Fetch real top holders from backend
                const res = await fetch('/api/bags/token/top-holders');
                if (!res.ok) throw new Error("Failed to fetch holders");

                const data = await res.json();

                if (mounted && Array.isArray(data)) {
                    // Map API data to UI structure
                    // Expected data: { address: '...', balance: 123, ... }
                    // If backend returns simple list, adapt here.
                    // Assuming Service returns array of objects.
                    const mapped = data.map((h, i) => {
                        // Backend uses 'balanceApprox'
                        const bal = h.balanceApprox || 0;
                        let displayTier = 'SHRIMP';

                        if (bal >= 10000000) displayTier = 'KRAKEN';
                        else if (bal >= 1000000) displayTier = 'WHALE';
                        else if (bal >= 500000) displayTier = 'ORCA';
                        else if (bal >= 100000) displayTier = 'SHARK';
                        else if (bal >= 50000) displayTier = 'DOLPHIN';
                        else if (bal >= 10000) displayTier = 'CRAB';

                        return {
                            rank: i + 1,
                            wallet: h.wallet || `???`,
                            displayWallet: (h.wallet || '').slice(0, 4) + '...' + (h.wallet || '').slice(-4),
                            tier: displayTier,
                            balance: bal
                        };
                    });
                    setHolders(mapped);
                }
            } catch (e) {
                console.error("CommunityGravity Load Error:", e);
                // Fallback to static mock if fetch fails, but STABLE this time
                if (mounted) {
                    setHolders(Array.from({ length: 10 }, (_, i) => ({
                        rank: i + 1,
                        displayWallet: `MOCK...${i}X`,
                        tier: 'MEMBER',
                        balance: 0
                    })));
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchHolders();
        return () => { mounted = false; };
    }, []);

    if (loading) return <div className="p-4 text-xs text-muted">Loading Gravity Well...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Header with improved styling */}
            <div style={{
                marginBottom: '12px',
                paddingLeft: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
            }}>
                <span className="text-label">GRAVITY WELL</span>
                <span className="text-label" style={{ fontSize: '10px', opacity: 0.5 }}>TOP 100</span>
            </div>

            <div className="surface-secondary" style={{
                flex: 1,
                overflowY: 'auto',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                padding: '0'
            }}>
                {holders.map((h) => (
                    <div key={h.rank} style={{
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
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <TierBadge balance={h.balance} size="xs" showName={true} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
