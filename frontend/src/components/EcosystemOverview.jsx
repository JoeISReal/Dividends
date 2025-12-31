import React, { useEffect, useState } from 'react';
import { useGameStore } from '../state/gameStore';

export default function EcosystemOverview() {
    const user = useGameStore(state => state.auth.user);
    const [stats, setStats] = useState({
        fees: '$...',
        holders: '...',
        mood: '...'
    });

    useEffect(() => {
        let mounted = true;
        const fetchData = async () => {
            try {
                // Parallel fetch for speed
                const [feesRes, statsRes, moodRes] = await Promise.all([
                    fetch('/api/bags/token/fees'),
                    fetch('/api/bags/token/stats'),
                    fetch('/api/ecosystem/mood')
                ]);

                if (!mounted) return;

                const feesData = await feesRes.json();
                const statsData = await statsRes.json();
                const moodData = await moodRes.json();

                // Format Fees: USD Currency
                const feesVal = feesData.totalFees
                    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(feesData.totalFees)
                    : '$0.00';

                // Format Holders
                const holdersVal = statsData.holderCount
                    ? new Intl.NumberFormat('en-US').format(statsData.holderCount)
                    : '---';

                setStats({
                    fees: feesVal,
                    holders: holdersVal,
                    mood: moodData.mood || 'STABLE'
                });
            } catch (e) {
                console.error("Dashboard Stats Error:", e);
            }
        };

        fetchData();
        // Refresh every 60s
        const interval = setInterval(fetchData, 60000);
        return () => { mounted = false; clearInterval(interval); };
    }, []);

    const metrics = [
        { label: 'FEES COLLECTED', value: stats.fees },
        { label: 'ACTIVE HOLDERS', value: stats.holders },
        // Placeholder for now as backend doesn't track distribution time yet
        { label: 'LAST DIST', value: '12m AGO' },
        { label: 'NEXT EST', value: '48m' },
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
