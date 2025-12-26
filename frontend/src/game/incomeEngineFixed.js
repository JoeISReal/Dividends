// src/game/incomeEngineFixed.js
import { STREAMS } from '../data/GameData';

/**
 * Calculates the passive income for a single tick.
 * Matches Backend Economy.js logic (Phase A + B).
 * 
 * @param {Object} state - The current game state (from Zustand)
 * @param {number} dtSeconds - Delta time in seconds for this tick
 * @returns {number} The amount of cash to add to balance this tick
 */
export function calculateIncome(state, dtSeconds) {
    if (!state || !state.streams) return 0;

    let totalIncome = 0;

    // Helper to get stream quantity
    const getQty = (id) => {
        const s = state.streams[id];
        if (!s) return 0;
        return Number(s.level || s.owned || 0);
    };

    // 1. Calculate Volatility & Stability (For Synergy)
    let stability = 100;
    let volatility = 1.0;

    // We used to iterate state.streams. Now we iterate STREAMS definition ensures we have metadata.
    // But we need to check if we own them in state.
    STREAMS.forEach(meta => {
        const qty = getQty(meta.id);
        if (qty > 0) {
            if (meta.stabilityImpact) stability += (meta.stabilityImpact * qty);
            if (meta.volatilityModifier) volatility += (meta.volatilityModifier * qty);
        }
    });
    stability = Math.max(0, stability);
    volatility = Math.max(0.1, volatility);


    // 2. Calculate Yield
    STREAMS.forEach(meta => {
        const streamState = state.streams[meta.id];
        if (!streamState) return;

        const count = Number(streamState.level || 0);
        if (count <= 0) return;

        // Manager Check
        const hasManager = streamState.hasManager === true || (state.managers && state.managers[meta.id] === true);
        if (!hasManager) return;

        let streamYield = meta.baseYield * count;

        // A. Decay
        if (meta.category === 'decay' && meta.decayRate) {
            const ageInfo = state.streamAges ? state.streamAges[meta.id] : null;
            const ageSec = ageInfo ? ageInfo.ageSec : 0;
            // Formula: Math.exp(-rate * minutes)
            const decayFactor = Math.exp(-meta.decayRate * (ageSec / 60));
            streamYield *= decayFactor;
        }

        // B. Synergy
        if (meta.category === 'synergy' && meta.synergyTags) {
            let synergyBonus = 0;

            if (meta.synergyTags.includes('volatility_boost')) {
                if (volatility > 1.0) synergyBonus += (volatility - 1.0);
            }
            if (meta.synergyTags.includes('volume_scale')) {
                // Count total levels
                const totalLevels = Object.values(state.streams).reduce((acc, s) => acc + (s.level || 0), 0);
                if (totalLevels > 50) synergyBonus += 0.2;
            }
            if (meta.synergyTags.includes('stake_multiplier')) {
                if (getQty('liquidity_pool') > 0) synergyBonus += 0.1;
                if (getQty('dao_treasury') > 0) synergyBonus += 0.15;
            }

            streamYield *= (1 + synergyBonus);
        }

        // C. Upgrades (Frontend Store usually has simpler upgrade logic 'click' vs 'global')
        // But backend `Economy.js` checks specific upgrades. 
        // Frontend `gameStore` only tracks `globalLevel` and `clickLevel`.
        // If we want 100% parity, we need specific per-stream upgrades on frontend too.
        // For now, apply GLOBAL multiplier.
        if (state.multipliers) {
            streamYield *= Number(state.multipliers.global || 1);
            streamYield *= Number(state.multipliers.prestige || 1);
        }

        // Apply specific stream boost from upgrades if they exist in state
        // (Legacy logic handling)
        if (state.upgrades) {
            const streamBoostKey = `${meta.id}_mult`;
            if (state.upgrades[streamBoostKey]) {
                const lvl = Number(state.upgrades[streamBoostKey]);
                streamYield *= (1 + 0.5 * lvl);
            }
        }

        totalIncome += streamYield;
    });

    return totalIncome * (dtSeconds || 0);
}
