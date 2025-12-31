export const HOLDER_TIERS = {
    SHRIMP: {
        id: 'shrimp',
        name: 'Shrimp',
        threshold: 0,
        color: '#94a3b8', // Slate 400
        icon: '🦐',
        className: 'tier-shrimp'
    },
    CRAB: {
        id: 'crab',
        name: 'Crab',
        threshold: 10000,
        color: '#f87171', // Red 400
        icon: '🦀',
        className: 'tier-crab'
    },
    DOLPHIN: {
        id: 'dolphin',
        name: 'Dolphin',
        threshold: 50000,
        color: '#60a5fa', // Blue 400
        icon: '🐬',
        className: 'tier-dolphin'
    },
    SHARK: {
        id: 'shark',
        name: 'Shark',
        threshold: 100000,
        color: '#facc15', // Yellow 400
        icon: '🦈',
        className: 'tier-shark'
    },
    ORCA: {
        id: 'orca',
        name: 'Orca',
        threshold: 500000,
        color: '#1e293b', // Slate 800 (Dark) or maybe a sleek Black/White? Let's go with B&W Tuxedo Look
        // Actually Orcas are killer whales. Let's give them a distinct Teal or Deep Blue
        color: '#2dd4bf', // Teal 400
        icon: '🐋',
        className: 'tier-orca'
    },
    WHALE: {
        id: 'whale',
        name: 'Whale',
        threshold: 1000000,
        color: '#a855f7', // Purple 500
        icon: '🌊',
        className: 'tier-whale'
    },
    KRAKEN: {
        id: 'kraken',
        name: 'Kraken',
        threshold: 10000000,
        color: '#f5c77a', // Gold
        icon: '🦑',
        className: 'tier-kraken'
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
    return HOLDER_TIERS.SHRIMP;
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
