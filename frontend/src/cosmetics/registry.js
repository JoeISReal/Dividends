export const HOLDER_TIERS = {
    OBSERVER: {
        id: 'observer',
        name: 'Observer',
        threshold: 0,
        color: '#a0a0a0', // Grey
        icon: '👁️',
        className: 'tier-observer'
    },
    HOLDER: {
        id: 'holder',
        name: 'Holder',
        threshold: 1000,
        color: '#4caf50', // Green
        icon: '🥬',
        className: 'tier-holder'
    },
    CONTRIBUTOR: {
        id: 'contributor',
        name: 'Contributor',
        threshold: 10000,
        color: '#2196f3', // Blue
        icon: '💎',
        className: 'tier-contributor'
    },
    WHALE: {
        id: 'whale',
        name: 'Whale',
        threshold: 100000, // 100k
        color: '#9c27b0', // Purple
        icon: '🐋',
        className: 'tier-whale'
    },
    SHARK: {
        id: 'shark',
        name: 'Shark',
        threshold: 250000, // 250k (New Tier)
        color: '#ff4c4c', // Red/Coral
        icon: '🦈',
        className: 'tier-shark'
    },
    INNER_CIRCLE: {
        id: 'inner_circle',
        name: 'Inner Circle',
        threshold: 1000000, // 1M
        color: '#ffd700', // Gold
        icon: '👑',
        className: 'tier-inner-circle'
    },
    AUTHORITY: {
        id: 'authority',
        name: 'Authority',
        threshold: 10000000, // 10M (1%)
        color: '#00dc82', // Neon Green
        icon: '🪐',
        className: 'tier-authority'
    }
};
export const getTier = (balance) => {
    // Sort tiers by threshold (descending) to find the highest match
    const tiers = Object.values(HOLDER_TIERS).sort((a, b) => b.threshold - a.threshold);
    for (const tier of tiers) {
        if (balance >= tier.threshold) {
            return tier;
        }
    }
    return HOLDER_TIERS.OBSERVER;
};

/**
 * Returns the next tier and progress percentage.
 */
export const getNextTierProgress = (balance) => {
    const currentTier = getTier(balance);
    const tiers = Object.values(HOLDER_TIERS).sort((a, b) => a.threshold - b.threshold);

    // Find index of current tier
    const currentIndex = tiers.findIndex(t => t.id === currentTier.id);

    // If max tier, return 100%
    if (currentIndex === tiers.length - 1) {
        return { nextTier: null, progress: 100, remaining: 0 };
    }

    const nextTier = tiers[currentIndex + 1];
    const range = nextTier.threshold - currentTier.threshold; // e.g. 10000 - 1000 = 9000
    const progress = balance - currentTier.threshold; // e.g. 1500 - 1000 = 500

    // Simple calculation (can be refined for logarithmic if needed)
    // For Observer (0) to Holder (1000), range is 1000.
    const percent = Math.min(100, Math.max(0, (progress / range) * 100));

    // Special case for observer starting at 0: just use balance / nextThreshold
    if (currentTier.threshold === 0) {
        return {
            nextTier,
            progress: Math.min(100, (balance / nextTier.threshold) * 100),
            remaining: nextTier.threshold - balance
        };
    }

    return {
        nextTier,
        progress: percent,
        remaining: nextTier.threshold - balance
    };
};


/* --- MOOD CONFIG (Restored) --- */
export const MOOD_CONFIG = {
    'QUIET': { color: '#9ca3af', name: 'Quiet' },
    'PUMP': { color: '#4caf50', name: 'Pump' },
    'DUMP': { color: '#ef4444', name: 'Dump' },
    'CRAB': { color: '#fbbf24', name: 'Crab' },
    'VOLATILE': { color: '#f472b6', name: 'Volatile' }
};
