import { useEffect, useRef } from "react";
import { useGame } from "./GameContext";

export default function useGameLoop(tickMs = 100) {
    const { state, actions, loaded } = useGame();
    const ref = useRef(null);
    useEffect(() => { ref.current = state }, [state]);

    useEffect(() => {
        if (!loaded || !state) return;
        // offline earnings
        const now = Date.now();
        const last = state.lastActive || now;
        const offlineSec = Math.floor((now - last) / 1000);
        if (offlineSec > 1) {
            const yps = computeYPS(state);
            const owed = yps * offlineSec;
            if (owed > 0) actions.addBalance(owed);
        }
        actions.setYPS(computeYPS(state));
        actions.incrementStat('lastTick', 0);
        let acc = 0;
        const id = setInterval(() => {
            const s = ref.current;
            if (!s) return;
            const yps = computeYPS(s);
            // award per tick
            const award = yps * (tickMs / 1000);
            if (award > 0) actions.addBalance(award);
            actions.setYPS(yps);
            actions.incrementStat('tickCount', 1);
            actions.patchLastActive = () => { }; // noop to keep consistent
        }, tickMs);
        return () => clearInterval(id);
    }, [loaded]);

    function computeYPS(s) {
        if (!s) return 0;
        let total = 0;
        s.streams.forEach(st => {
            const owned = st.owned || 0;
            if (owned === 0) return; // Skip unowned streams

            // ONLY auto-produce if stream has a manager
            if (!st.hasManager) return;

            let mult = 1;

            // Apply unlock multipliers
            st.unlocks?.forEach(u => {
                if (owned >= u.owned && u.type === 'profit') {
                    mult *= u.multiplier;
                }
            });

            // Apply stream-specific upgrade
            const upKey = `${st.id}_mult`;
            if (s.upgrades?.[upKey]) mult *= (1 + 0.5 * s.upgrades[upKey]);

            // Global multiplier upgrade
            if (s.upgrades?.['global_mult']) mult *= (1 + 0.1 * s.upgrades['global_mult']);

            // Calculate yield: baseYield * owned / baseTime * multipliers
            total += (st.baseYield * owned / st.baseTime) * mult;
        });
        total *= (s.shareholderMultiplier || 1);
        return total;
    }
}
