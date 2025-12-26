/**
 * XP System Logic
 * Handles XP calculation, leveling, and caps.
 */
export const XP_CONFIG = {
    xpCapPerRound: 500,
    baseLevelXP: 1000,
    volatilityMultiplier: 10,
    baseMultiplier: 2
};

export class XPSystem {
    constructor(state = {}) {
        this.xp = state.xp || 0;
        this.level = state.level || 0;
        this.xpToNext = state.xpToNext || XP_CONFIG.baseLevelXP;
        this.roundXP = 0; // Track XP gained in current "round" or session if needed
    }

    /**
     * Calculates potentially gained XP from a trade
     */
    calculateTradeXP(betSize, volatility, momentum) {
        // baseXP = sqrt(betSize) * 2
        const baseXP = Math.floor(Math.sqrt(Math.abs(betSize)) * XP_CONFIG.baseMultiplier);

        // volatilityFactor = max(1, abs(momentum) * 10)
        // using volatility passed in, or momentum estimate
        const volFactor = Math.max(1, Math.abs(momentum) * XP_CONFIG.volatilityMultiplier);

        return Math.floor(baseXP * volFactor);
    }

    /**
     * Adds XP and returns new state updates
     * @param {number} amount - XP to add
     * @param {number} currentRoundXP - XP already gained this round (passed from store)
     * @param {number} fatigue - Current player fatigue (0-100)
     * @returns {Object} { xp, level, xpToNext, gained }
     */
    addXP(amount, currentRoundXP = 0, fatigue = 0) {
        // 1. Fatigue Penalty
        // Efficiency = 1.0 - (Fatigue * 0.008), Min 0.2
        const efficiency = Math.max(0.2, 1.0 - (fatigue * 0.008));
        const effectiveAmount = Math.floor(amount * efficiency);

        if (effectiveAmount <= 0) return null;

        let newXP = this.xp + effectiveAmount;
        let currentLevel = this.level;

        // 2. Level Up Logic (Iterative to match Backend Logarithmic Curve)
        // Cost(L) = 1000 * log2(L+2)^1.4
        // We subtract cost from XP? Or is XP cumulative?
        // "XP Required = baseXP * log...". Usually means Cumulative XP.
        // Backend `getLevelFromXP` treats `xp` as Spendable/Cumulative?
        // Backend `getLevelFromXP` loop: `if (currentXP >= cost) { currentXP -= cost; level++ }`
        // So XP is "spent" to level up? Or is it a cumulative threshold?
        // The loop `currentXP -= cost` implies it's a "bucket" model where you fill the bucket to level up, and the bucket empties (or you track Level + CurrentLevelProgress).
        // Frontend `state.xp` stores the *Total Unspent*? Or Total Cumulative?
        // `gameStore` has `xp: 0`.
        // Let's assume Standard RPG: XP Accumulates, Level is derived from Total, OR XP resets on level up.
        // Backend logic: `currentXP -= nextLevelCost`. This means XP resets to 0 (relative to level) on level up.
        // So `this.xp` is "Current Level XP".

        // Loop to process multiple level ups
        while (true) {
            const cost = Math.floor(1000 * Math.pow(Math.log2(currentLevel + 2), 1.4));
            if (newXP >= cost) {
                newXP -= cost;
                currentLevel++;
            } else {
                break;
            }
        }

        const costNext = Math.floor(1000 * Math.pow(Math.log2(currentLevel + 2), 1.4));
        const xpToNext = costNext - newXP;

        this.xp = newXP;
        this.level = currentLevel;
        this.xpToNext = xpToNext;

        return {
            xp: newXP,
            level: currentLevel,
            xpToNext: xpToNext,
            gained: effectiveAmount
        };
    }
}
