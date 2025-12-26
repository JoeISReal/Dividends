import { useMemo } from 'react';
import { useGameStore } from '../state/gameStore';

/**
 * useSystemState Hook
 * Maps authoritative Directive System signals to UX/Dashboard state.
 * 
 * Rules:
 * - Yield Velocity: success+"rising" -> UP; warning+"decelerating" -> DOWN; else NEUTRAL.
 * - Risk Pressure: critical -> CRITICAL; warning+"volatility/elevated" -> ELEVATED; else LOW.
 * - Automation: "gap detected" -> OFFLINE; "online" -> ONLINE.
 * - Activity: any signal < 5s ago -> ACTIVE.
 * - Locks: Risk=CRITICAL -> isLocked=true.
 */
export function useSystemState() {
    const signals = useGameStore(s => s.signals);
    const now = Date.now();

    const state = useMemo(() => {
        // Defaults
        let velocity = { status: 'NEUTRAL', label: '— STABLE', color: 'var(--text-secondary)' };
        let risk = { status: 'LOW', label: 'LOW', color: 'var(--accent-green)', bars: 1 };
        let automation = { status: 'IDLE', label: 'ONLINE', color: 'var(--text-secondary)' }; // distinct from "ONLINE" (green) which is explicit success
        let activity = { active: false, label: '— STABLE' };
        let isLocked = false;

        // 1. Analyze Signals (Newest first)
        // We look for the *latest* relevant directive for each category.

        // Velocity Search
        const velocitySignal = signals.find(s =>
            (s.type === 'success' && s.message.includes('Yield velocity rising')) ||
            (s.type === 'warning' && s.message.includes('Yield velocity decelerating'))
        );

        if (velocitySignal) {
            // Check if "stale" (> 30s)? 
            // Directive Engine emits every 15s if condition persists. 
            // If > 30s, assume it cleared without a specific "Stable" message (since engine doesn't emit "Stable Velocity").
            const isFresh = (now - velocitySignal.timestamp) < 30000;

            if (isFresh) {
                if (velocitySignal.type === 'success') {
                    velocity = { status: 'UP', label: '▲ RISING', color: 'var(--accent-green)' };
                } else {
                    velocity = { status: 'DOWN', label: '▼ DRAG', color: 'var(--accent-red)' }; // Amber/Red for warning
                }
            }
        }

        // Risk Search
        // Signals: "Critical instability", "Risk pressure elevated", "System stabilized"
        const riskSignal = signals.find(s =>
            s.message.includes('Critical instability') ||
            s.message.includes('Risk pressure elevated') ||
            s.message.includes('System stabilized')
        );

        if (riskSignal) {
            // Risk state persists until changed or very stale?
            // "System stabilized" is the "all clear" signal.
            // "Critical" or "Elevated" persist until "Stabilized" usually.
            // But if we haven't seen any for a long time, assume LOW?
            // Let's assume LOW if > 60s and no recent updates, but relying on "System stabilized" is safer if engine guarantees it.
            // DirectiveEngine emits "System stabilized" when dropping from high/crit.

            if (riskSignal.message.includes('Critical instability')) {
                risk = { status: 'CRITICAL', label: 'CRITICAL', color: 'var(--accent-red)', bars: 5 };
                isLocked = true;
            } else if (riskSignal.message.includes('Risk pressure elevated')) {
                risk = { status: 'ELEVATED', label: 'ELEVATED', color: 'var(--accent-orange)', bars: 3 };
            } else if (riskSignal.message.includes('System stabilized')) {
                risk = { status: 'LOW', label: 'LOW', color: 'var(--accent-green)', bars: 1 };
            }
        }

        // Automation Search
        // Signals: "Automation gap detected", "Automation online"
        const autoSignal = signals.find(s =>
            s.message.includes('Automation gap detected') ||
            s.message.includes('Automation online')
        );

        if (autoSignal) {
            if (autoSignal.message.includes('Automation gap detected')) {
                automation = { status: 'OFFLINE', label: 'GAP DETECTED', color: 'var(--accent-orange)' };
            } else {
                automation = { status: 'ONLINE', label: 'ONLINE', color: 'var(--accent-green)' };
            }
        }

        // Activity Check
        const recentActivity = signals.some(s => (now - s.timestamp) < 5000);
        if (recentActivity) {
            activity = { active: true, label: '● ACTIVE' };
        }

        return {
            velocity,
            risk,
            automation,
            activity,
            isLocked
        };

    }, [signals, now]);

    return state;
}
