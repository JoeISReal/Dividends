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
    // We handle both array (GameContext default) and object (gameStore legacy) structures just in case,
    // but based on latest file views, GameContext uses an array of objects.
    const streams = Array.isArray(state.streams)
        ? state.streams
        : Object.entries(state.streams).map(([key, val]) => ({ ...val, id: key }));


    for (const stream of streams) {
        // FAILSAFE 1: If count/owned is 0, no income.
        const count = stream.owned || stream.level || 0;
        if (count <= 0) continue;

        // FAILSAFE 2: If no manager, STRICTLY NO PASSIVE INCOME.
        // We check specifically for the boolean true.
        // Also check if stream.id is in state.managers if not on stream object directly, for robustness
        const hasManager = stream.hasManager === true || (state.managers && state.managers[stream.id] === true);

        if (!hasManager) {
            continue;
        }

        // Calculate base yield for this stream
        // Formula: (baseYield * count) / cycleTime
        // If cycleTime is 0 or missing, assume 1s to avoid divide by zero (though data says baseTime >= 1)
        const cycleTime = stream.baseTime || 1;
        const rawYield = (stream.baseYield * count) / cycleTime;

        // Apply Multipliers
        let multiplier = 1;

        // 1. Unlocks (milestones)
        if (stream.unlocks && Array.isArray(stream.unlocks)) {
            for (const unlock of stream.unlocks) {
                if (count >= unlock.owned && unlock.type === 'profit') {
                    multiplier *= unlock.multiplier;
                }
            }
        }

        // 2. Global Multipliers (from upgrades/prestige)
        // Check both old 'multipliers' object and new 'upgrades' map patterns
        if (state.multipliers) {
            multiplier *= (state.multipliers.global || 1);
            multiplier *= (state.multipliers.prestige || 1);
        }

        // 3. Upgrade Catalog / Upgrades Map
        // Example: 'global_mult' or specific stream upgrades
        if (state.upgrades) {
            if (state.upgrades['global_mult']) {
                multiplier *= (1 + 0.1 * state.upgrades['global_mult']);
            }
            // Stream specific boost
            const streamBoostKey = `${stream.id}_mult`;
            if (state.upgrades[streamBoostKey]) {
                multiplier *= (1 + 0.5 * state.upgrades[streamBoostKey]);
            }
        }

        if (state.shareholderMultiplier) {
            multiplier *= state.shareholderMultiplier;
        }

        // Final failsafe clamp for manager
        const corruptionCheck = stream.hasManager ? 1 : 0;

        totalIncome += (rawYield * multiplier * corruptionCheck);
    }

    return totalIncome * dtSeconds;
}
