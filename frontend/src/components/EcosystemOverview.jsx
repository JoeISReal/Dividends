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
                // Fetch from our new robust Serverless Proxies (Cached)
                const [feesRes, holdersRes] = await Promise.all([
                    fetch('/api/v1/fees'),
                    fetch('/api/v1/holders')
                ]);

                if (!mounted) return;

                if (feesRes.ok) {
                    const feesData = await feesRes.json();
                    if (feesData.formatted) {
                        setStats(prev => ({ ...prev, fees: feesData.formatted }));
                    }
                } else {
                    let errMsg = `ERR:${feesRes.status}`;
                    try {
                        const errJson = await feesRes.json();
                        if (errJson.error) errMsg = `ERR:${errJson.error.substring(0, 10)}`;
                    } catch (e) { }
                    setStats(prev => ({ ...prev, fees: errMsg }));
                }

                if (holdersRes.ok) {
                    const holdersData = await holdersRes.json();
                    if (holdersData.formatted) {
                        setStats(prev => ({ ...prev, holders: holdersData.formatted }));
                    }
                } else {
                    let errMsg = `ERR:${holdersRes.status}`;
                    try {
                        const errJson = await holdersRes.json();
                        if (errJson.error) errMsg = `ERR:${errJson.error.substring(0, 10)}`;
                    } catch (e) { }
                    setStats(prev => ({ ...prev, holders: errMsg }));
                }

            } catch (e) {
                console.error("Stats Fetch Error:", e);
                setStats(prev => ({
                    ...prev,
                    fees: "ERR:FETCH",
                    holders: "ERR:FETCH"
                }));
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000); // 60s refresh
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
