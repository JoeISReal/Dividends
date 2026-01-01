import React, { useEffect, useState } from 'react';
import { useGameStore } from '../state/gameStore';

export default function EcosystemOverview() {
    const user = useGameStore(state => state.auth.user);
    const [stats, setStats] = useState({
        fees: '$...',
        holders: '...',
        mood: '...'
    });

    const RPC_LIST = [
        "https://solana-mainnet.g.alchemy.com/v2/GOu50-6Y3sqi0q3AdLMFq",
        "https://solana-mainnet.rpc.extrnode.com",
        "https://rpc.ankr.com/solana"
    ];

    useEffect(() => {
        let mounted = true;

        const parseFees = async () => {
            // 1. Fetch Fees (Lamports)
            try {
                const res = await fetch("https://api2.bags.fm/api/v1/token-launch/lifetime-fees?tokenMint=7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS");
                const data = await res.json();
                if (data.success && data.response) {
                    const sol = Number(data.response) / 1000000000;

                    // 2. Fetch Price (Jupiter)
                    let price = 180; // Safe fallback
                    try {
                        const pRes = await fetch("https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112");
                        const pJson = await pRes.json();
                        if (pJson.data && pJson.data['So11111111111111111111111111111111111111112']) {
                            price = Number(pJson.data['So11111111111111111111111111111111111111112'].price);
                        }
                    } catch (e) { console.warn("Price fetch failed", e); }

                    const totalUsd = sol * price;
                    if (mounted) {
                        setStats(prev => ({
                            ...prev,
                            fees: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalUsd)
                        }));
                    }
                }
            } catch (e) { console.error("Fees Error:", e); }
        };

        const countHolders = async () => {
            const payload = JSON.stringify({
                jsonrpc: "2.0", id: 1, method: "getProgramAccounts",
                params: [
                    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                    {
                        encoding: "base64",
                        filters: [
                            { dataSize: 165 },
                            { memcmp: { offset: 0, bytes: "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS" } }
                        ],
                        dataSlice: { offset: 0, length: 0 } // Just count, no data
                    }
                ]
            });

            for (const rpc of RPC_LIST) {
                if (!mounted) return;
                try {
                    const res = await fetch(rpc, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
                    if (!res.ok) continue;
                    const json = await res.json();
                    if (json.result) {
                        if (mounted) {
                            setStats(prev => ({
                                ...prev,
                                holders: new Intl.NumberFormat('en-US').format(json.result.length)
                            }));
                        }
                        return; // Success
                    }
                } catch (e) { console.warn("Holder Count Error", e); }
            }
        };

        // Execute
        parseFees();
        countHolders();

        // Refresh every 60s
        const interval = setInterval(() => {
            parseFees();
            countHolders();
        }, 60000);

        return () => { mounted = false; clearInterval(interval); };
    }, []);

    const metrics = [
        { label: 'FEES COLLECTED', value: stats.fees },
        { label: 'ACTIVE HOLDERS', value: stats.holders },
    ];

    return (
        <div className="surface-primary" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-4)',
            border: '1px solid var(--border-subtle)'
        }}>
            <div style={{ display: 'flex', gap: '32px' }}>
                {metrics.map((m, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="text-label" style={{ fontSize: '10px', opacity: 0.6 }}>{m.label}</span>
                        <span className="text-value" style={{ fontSize: '14px' }}>{m.value}</span>
                    </div>
                ))}
            </div>

            {/* USER TIER - Right Aligned */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <span className="text-label" style={{ fontSize: '10px', opacity: 0.6 }}>YOUR TIER</span>
                    <span className="text-value" style={{ fontSize: '14px', color: 'var(--accent-gold)' }}>
                        {user?.holderTier || 'MEMBER'}
                    </span>
                </div>
            </div>
        </div>
    );
}
