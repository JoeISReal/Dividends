import React from 'react';
import { SystemStateStrip } from './SystemStateStrip';
import { SystemFeed } from './SystemFeed'; // Assuming this exists or borrowing logic
import { useSystemState } from '../hooks/useSystemState';

export default function SystemAwareness() {
    const { risk, signal } = useSystemState();

    // Simple visual mapping for Risk Pressure
    const riskColor = risk.status === 'CRITICAL' ? 'var(--accent-red)'
        : risk.status === 'ELEVATED' ? 'var(--accent-orange)'
            : 'var(--accent-green)';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="text-label" style={{ paddingLeft: '4px' }}>SYSTEM AWARENESS</div>

            {/* STACK */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                {/* 1. System State Strip (Reuse existing) */}
                <SystemStateStrip />

                {/* 2. Yield Velocity (Mocked/Simple) */}
                <div className="surface-secondary" style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span className="text-label">YIELD VELOCITY</span>
                    <span className="text-value" style={{ color: 'var(--accent-green)' }}>▲ STABLE</span>
                </div>

                {/* 3. Risk Pressure */}
                <div className="surface-secondary" style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className="text-label">RISK PRESSURE</span>
                        <span className="text-label" style={{ color: riskColor }}>{risk.status}</span>
                    </div>
                    {/* Safe gauge visual */}
                    <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: risk.status === 'CRITICAL' ? '90%' : (risk.status === 'ELEVATED' ? '60%' : '20%'),
                            background: riskColor,
                            transition: 'all 0.5s ease'
                        }} />
                    </div>
                </div>

                {/* 4. Directive Feed (Manual Implementation if pure component doesn't fit, reusing logic) */}
                <div style={{ marginTop: '8px' }}>
                    {/* We can reuse the SystemFeed logic or component if it fits the "Silent = Stability" rule */}
                    {/* Assuming SystemFeed handles its own rendering and we just place it */}
                    {/* If it's too noisy, we might need to wrap or customize it. 
                         For now, let's place it. User said "Directive Feed -> Authoritative only" */}
                    <div className="surface-secondary" style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        minHeight: '100px'
                    }}>
                        <div className="text-label" style={{ marginBottom: '8px' }}>DIRECTIVE FEED</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {/* Placeholder for feed content */}
                            <SystemFeed limit={3} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
