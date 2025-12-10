import { useEffect, useRef } from 'react';
import { useGameStore } from '../state/gameStore';
import { calculateIncome } from './incomeEngineFixed';

/**
 * Main Game Loop Hook
 * Handles:
 * 1. Offline Earnings (tick on mount)
 * 2. Active Game Loop (setInterval)
 * 3. Stats update (tick count)
 */
export default function useGameLoop(tickMs = 100) {
    const addBalance = useGameStore((s) => s.addBalance);
    const setYPS = useGameStore((s) => s.setYPS);
    const incrementStat = useGameStore((s) => s.incrementStat);

    // Use refs for state access inside interval to avoid re-creating the interval
    const stateRef = useRef(useGameStore.getState());

    // Sync ref with store updates
    useEffect(() => {
        const unsub = useGameStore.subscribe((state) => {
            stateRef.current = state;
        });
        return unsub;
    }, []);

    useEffect(() => {
        // 1. Offline Earnings Calculation
        const state = useGameStore.getState();
        const now = Date.now();
        const last = state.lastActive || now;
        const offlineSec = Math.floor((now - last) / 1000);

        if (offlineSec > 1) {
            const offlineIncome = calculateIncome(state, offlineSec);
            if (offlineIncome > 0) {
                addBalance(offlineIncome);
            }
        }

        // 2. Initial YPS Update (fix stale UI)
        const currentYPS = calculateIncome(state, 1);
        setYPS(currentYPS);
        useGameStore.setState({ lastActive: now });

        // 3. Start Interval
        const id = setInterval(() => {
            const s = stateRef.current;
            if (!s) return;

            const dtSec = tickMs / 1000;

            // Calculate and award income
            const income = calculateIncome(s, dtSec);
            if (income > 0) {
                addBalance(income);
            }

            // Update UI YPS occasionally (every tick is fine for now, or throttle it)
            // We re-calc strictly to ensure UI matches reality
            // Optimization: Only do this if structure changed? No, easier to just calc.
            const uiYPS = calculateIncome(s, 1);
            if (uiYPS !== s.yps) {
                setYPS(uiYPS);
            }

            // Update stats
            useGameStore.setState({ lastActive: Date.now() });

        }, tickMs);

        return () => clearInterval(id);
    }, [tickMs, addBalance, setYPS]);
}
