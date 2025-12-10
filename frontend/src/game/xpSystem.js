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
     * @returns {Object} { xp, level, xpToNext, gained }
     */
    addXP(amount, currentRoundXP = 0) {
        // Cap check
        const available = XP_CONFIG.xpCapPerRound - currentRoundXP;
        const gained = Math.min(amount, Math.max(0, available));

        if (gained <= 0) return null;

        let newXP = this.xp + gained;
        let newLevel = this.level;

        // Simple linear leveling for now: every 1000 XP
        // Or accumulating: level = floor(xp / 1000)
        newLevel = Math.floor(newXP / XP_CONFIG.baseLevelXP);
        const nextLevelXP = (newLevel + 1) * XP_CONFIG.baseLevelXP;
        const xpToNext = nextLevelXP - newXP;

        this.xp = newXP;
        this.level = newLevel;
        this.xpToNext = xpToNext;

        return {
            xp: newXP,
            level: newLevel,
            xpToNext: xpToNext,
            gained: gained
        };
    }
}
