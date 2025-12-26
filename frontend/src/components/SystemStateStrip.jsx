import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../state/gameStore';
import { useSystemState } from '../hooks/useSystemState';

export function SystemStateStrip({ className }) {
    const { velocity, risk, automation, activity } = useSystemState();
    const signals = useGameStore(s => s.signals);

    // Automation: Get local counts just for the display value (metrics remain visible)
    const streams = useGameStore(s => s.streams);
    // Safe conversion matching directiveEngine logic
    const streamsList = Array.isArray(streams) ? streams : Object.values(streams || {});
    const totalStreams = streamsList.length;
    const automatedStreams = streamsList.filter(s => s.hasManager).length;

    // Latest Active Directive for the Banner
    // We show the most recent signal if it's relatively fresh (< 20s) to keep the "Voice of Authority" present.
    // If it's a "System stabilized" info signal, it might be worth showing briefly.
    const latestSignal = signals[0];
    const showBanner = latestSignal && (Date.now() - latestSignal.timestamp < 20000);

    return (
        <div className={`flex flex-col ${className || ''}`}>
            {/* MAIN STRIP */}
            <div className="system-state-strip surface-hud" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)', // 4 Equal columns
                padding: 'var(--space-3)',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                backgroundColor: 'rgba(0,0,0,0.2)',
                gap: 'var(--space-2)'
            }}>
                {/* 1. Yield Velocity */}
                <div className="state-cell">
                    <div className="state-label">YIELD VELOCITY</div>
                    <div className="state-value" style={{ color: velocity.color }}>{velocity.label}</div>
                </div>

                {/* 2. Risk Pressure */}
                <div className="state-cell">
                    <div className="state-label">RISK PRESSURE</div>
                    <div className="state-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: risk.color }}>{risk.label}</span>
                        <div className="pressure-bars">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="bar" style={{
                                    backgroundColor: i < risk.bars ? risk.color : 'rgba(255,255,255,0.1)'
                                }} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Automation */}
                <div className="state-cell">
                    <div className="state-label">AUTOMATION</div>
                    {/* Prompt: Metrics remain visible. we show Status via Color/Label context if needed, but text can be metrics */}
                    <div className="state-value" style={{ color: automation.color }}>
                        {automatedStreams} / {totalStreams} STREAMS
                    </div>
                </div>

                {/* 4. Activity */}
                <div className="state-cell">
                    <div className="state-label">ACTIVITY</div>
                    <div className="state-value" style={{
                        color: activity.active ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        fontWeight: activity.active ? 600 : 400
                    }}>
                        {activity.label}
                    </div>
                </div>
            </div>

            {/* SYSTEM DIRECTIVE (Authoritative Voice) */}
            {showBanner && (
                <div className="surface-hud" style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    padding: '8px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'rgba(0,0,0,0.4)',
                    animation: latestSignal.type === 'critical' ? 'pulse-red 2s infinite' : 'none'
                }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getSignalColor(latestSignal.type),
                        boxShadow: `0 0 8px ${getSignalColor(latestSignal.type)}`
                    }} />
                    <span style={{
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: getSignalColor(latestSignal.type),
                        letterSpacing: '0.05em'
                    }}>
                        {latestSignal.message} {latestSignal.detail && `— ${latestSignal.detail}`}
                    </span>
                </div>
            )}

            <style jsx>{`
                .state-cell {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 0 var(--space-2);
                    border-right: 1px solid rgba(255,255,255,0.05);
                }
                .state-cell:last-child {
                    border-right: none;
                }
                .state-label {
                    font-size: 10px;
                    letter-spacing: 0.1em;
                    color: var(--text-muted);
                    text-transform: uppercase;
                }
                .state-value {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 13px;
                    font-weight: 500;
                    white-space: nowrap;
                }
                .pressure-bars {
                    display: flex;
                    gap: 2px;
                }
                .bar {
                    width: 4px;
                    height: 8px;
                    border-radius: 1px;
                }
                @keyframes pulse-red {
                    0% { box-shadow: inset 0 0 0 rgba(255,50,50,0); }
                    50% { box-shadow: inset 0 0 20px rgba(255,50,50,0.2); }
                    100% { box-shadow: inset 0 0 0 rgba(255,50,50,0); }
                }
                @media (max-width: 600px) {
                    .system-state-strip {
                        grid-template-columns: 1fr 1fr;
                        gap: var(--space-3);
                    }
                    .state-cell {
                        border-right: none;
                    }
                }
            `}</style>
        </div>
    );
}

function getSignalColor(type) {
    switch (type) {
        case 'success': return 'var(--accent-green)';
        case 'warning': return 'var(--accent-orange)';
        case 'critical':
        case 'danger': return 'var(--accent-red)';
        default: return 'var(--text-blue)';
    }
}
