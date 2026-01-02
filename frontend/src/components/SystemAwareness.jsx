import React from 'react';
import { SystemStateStrip } from './SystemStateStrip';
import { useSystemState } from '../hooks/useSystemState';

export default function SystemAwareness() {
    const { risk, signal } = useSystemState();

    // Map risk status to severity color and segment count
    const getRiskVisuals = (status) => {
        switch (status) {
            case 'CRITICAL': return { color: 'var(--accent-red)', segments: 12, label: 'CRITICAL' };
            case 'ELEVATED': return { color: 'var(--accent-orange)', segments: 8, label: 'ELEVATED' };
            default: return { color: 'var(--accent-green)', segments: 3, label: 'LOW' }; // Stable/Low
        }
    };

    const riskVisual = getRiskVisuals(risk.status);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="text-label" style={{ paddingLeft: '4px', letterSpacing: '0.15em' }}>SYSTEM AWARENESS</div>

            {/* STACK */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                {/* 1. System State Strip (Reuse existing) */}
                <SystemStateStrip />

                {/* 2. Yield Velocity (Instrument: Readout) */}
                <div className="surface-secondary" style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(0,0,0,0.3)'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="text-label" style={{ fontSize: '10px' }}>YIELD VELOCITY</span>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'var(--accent-green)',
                            textShadow: '0 0 10px rgba(74, 222, 128, 0.1)'
                        }}>
                            <span style={{ fontSize: '18px' }}>▲</span>
                            <span className="text-value" style={{ fontSize: '16px' }}>STABLE</span>
                        </div>
                    </div>
                    {/* Tick marks decoration */}
                    <div style={{ display: 'flex', gap: '2px', opacity: 0.3 }}>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} style={{ width: '2px', height: '12px', background: 'var(--text-primary)' }} />
                        ))}
                    </div>
                </div>

                {/* 3. Risk Pressure (Instrument: Segmented Gauge) */}
                <div className="surface-secondary" style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'rgba(0,0,0,0.3)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'flex-end' }}>
                        <span className="text-label" style={{ fontSize: '10px' }}>RISK PRESSURE</span>
                        <span className="text-value" style={{ color: riskVisual.color, fontSize: '14px' }}>{riskVisual.label}</span>
                    </div>

                    {/* Segmented Bar */}
                    <div style={{ display: 'flex', gap: '2px', height: '6px', width: '100%' }}>
                        {[...Array(12)].map((_, i) => {
                            const active = i < riskVisual.segments;
                            return (
                                <div key={i} style={{
                                    flex: 1,
                                    background: active ? riskVisual.color : 'rgba(255,255,255,0.1)',
                                    opacity: active ? 1 : 0.2,
                                    borderRadius: '1px'
                                }} />
                            );
                        })}
                    </div>
                </div>



            </div>
        </div>
    );
}
