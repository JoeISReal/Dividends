// src/game/incomeEngineFixed.js

/**
 * Calculates the passive income for a single tick.
 * 
 * STRICT RULES:
 * 1. Streams produce 0 passive income unless 'hasManager' is true.
 * 2. Manual clicks are handled separately (in gameStore).
 * 3. This function relies on a pure state snapshot.
 * 
 * @param {Object} state - The current game state (from Zustand)
 * @param {number} dtSeconds - Delta time in seconds for this tick
 * @returns {number} The amount of cash to add to balance this tick
 */
export function calculateIncome(state, dtSeconds) {
    if (!state || !state.streams) return 0;

    let totalIncome = 0;

    // Iterate through all streams in the state
    const streams = Array.isArray(state.streams)
        ? state.streams
        : Object.entries(state.streams).map(([key, val]) => ({ ...val, id: key }));


    for (const stream of streams) {
        // FAILSAFE 1: If count/owned is 0, no income.
        const count = Number(stream.owned || stream.level || 0);
        if (isNaN(count) || count <= 0) continue;

        // FAILSAFE 2: If no manager, STRICTLY NO PASSIVE INCOME.
        const hasManager = stream.hasManager === true || (state.managers && state.managers[stream.id] === true);

        if (!hasManager) {
            continue;
        }

        // Calculate base yield for this stream
        const cycleTime = Number(stream.baseTime || 1);
        const baseYield = Number(stream.baseYield || stream.baseYps || 0);

        let rawYield = (baseYield * count) / (cycleTime > 0 ? cycleTime : 1);

        if (isNaN(rawYield)) rawYield = 0;

        // Apply Multipliers
        let multiplier = 1;

        // 1. Unlocks (milestones)
        if (stream.unlocks && Array.isArray(stream.unlocks)) {
            for (const unlock of stream.unlocks) {
                const uOwned = Number(unlock.owned || 0);
                if (count >= uOwned && unlock.type === 'profit') {
                    multiplier *= Number(unlock.multiplier || 1);
                }
            }
        }

        // 2. Global Multipliers (from upgrades/prestige)
        if (state.multipliers) {
            multiplier *= Number(state.multipliers.global || 1);
            multiplier *= Number(state.multipliers.prestige || 1);
        }

        // 3. Upgrade Catalog
        if (state.upgrades) {
            if (state.upgrades['global_mult']) {
                const lvl = Number(state.upgrades['global_mult'] || 0);
                multiplier *= (1 + 0.1 * lvl);
            }
            // Stream specific boost
            const streamBoostKey = `${stream.id}_mult`;
            if (state.upgrades[streamBoostKey]) {
                const lvl = Number(state.upgrades[streamBoostKey] || 0);
                multiplier *= (1 + 0.5 * lvl);
            }
        }

        if (state.shareholderMultiplier) {
            multiplier *= Number(state.shareholderMultiplier || 1);
        }

        if (isNaN(multiplier)) multiplier = 1;

        totalIncome += (rawYield * multiplier);
    }

    const finalVal = totalIncome * Number(dtSeconds || 0);
    return isNaN(finalVal) ? 0 : finalVal;
}
