import React, { useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { TierBadge } from './TierBadge';

const RPC_ENDPOINTS = [
    "https://api.mainnet-beta.solana.com", // Reliable for getLargestAccounts
    "https://solana-mainnet.rpc.extrnode.com",
    "https://rpc.ankr.com/solana"
];

export default function CommunityGravity() {
    const [holders, setHolders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const fetchHolders = async () => {
            try {
                // 1. Try Backend API first
                const res = await fetch('/api/bags/token/top-holders');

                let data = null;
                if (res.ok) {
                    data = await res.json();
                }

                // 2. Validate Data (If failed or empty/mock, try rescue)
                const isValid = Array.isArray(data) && data.length > 0 && !data[0].wallet?.startsWith('MOCK');

                if (isValid) {
                    mapAndSetHolders(data);
                } else {
                    // Backend alive but gave bad data (or mock)
                    throw new Error("Backend Returned Invalid/Mock Data");
                }

            } catch (e) {
                console.warn("Backend unavailable/invalid, triggering Client-Side Rescue...", e);
                await rescueFetch();
            } finally {
                if (mounted) setLoading(false);
            }
        };

        const rescueFetch = async () => {
            // Fallback to public RPCs loop
            const MINT = "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";

            for (const rpc of RPC_ENDPOINTS) {
                try {
                    console.log("Attempting rescue via:", rpc);
                    const conn = new Connection(rpc, 'confirmed');

                    // Light call: Top 20 holders
                    const largest = await conn.getTokenLargestAccounts(new PublicKey(MINT));
                    const accounts = largest.value || [];

                    if (accounts.length === 0) throw new Error("Empty accounts list");

                    const mapped = accounts.map((a, i) => ({
                        rank: i + 1,
                        // Use Address as display since we don't have Owner map here yet
                        wallet: a.address.toString(),
                        displayWallet: (a.address.toString()).slice(0, 4) + '...' + (a.address.toString()).slice(-4),
                        balance: a.uiAmount,
                        isRescue: true
                    }));

                    if (mounted) {
                        setHolders(mapped);
                        return; // Success, exit loop
                    }
                } catch (err) {
                    console.warn(`Rescue failed on ${rpc}:`, err);
                }
            }

            // If all RPCs fail, revert to Static Mock
            console.error("All Rescue RPCs failed. Showing Static Mock.");
            if (mounted) {
                setHolders(Array.from({ length: 50 }, (_, i) => ({
                    rank: i + 1,
                    displayWallet: `MOCK...${i}X`,
                    balance: Math.floor(10000000 * Math.pow(0.85, i))
                })));
            }
        };

        const mapAndSetHolders = (data) => {
            if (!mounted) return;
            const mapped = data.map((h, i) => ({
                rank: i + 1,
                wallet: h.wallet || `???`,
                displayWallet: (h.wallet || '').slice(0, 4) + '...' + (h.wallet || '').slice(-4),
                balance: h.balanceApprox || 0
            }));
            setHolders(mapped);
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
