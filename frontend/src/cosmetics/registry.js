
// Phase 2B: Contextual Flavor + Cosmetics
// Strict Visual System Registry

export const TIER_ICONS = {
    NONE: '—',
    TINY: '•',
    MEDIUM: '▲',
    CHAD: '◈',
    WHALE: '◉'
};

export const TIER_CONFIG = {
    NONE: {
        id: 'NONE',
        label: 'No Badge',
        icon: TIER_ICONS.NONE,
        color: '#9ca3af', // Neutral Gray
        bg: 'transparent',
        weight: 400,
        effect: ''
    },
    TINY: {
        id: 'TINY',
        label: 'Tiny',
        icon: TIER_ICONS.TINY,
        color: '#22d3ee', // Cyan-300
        bg: 'rgba(34, 211, 238, 0.1)',
        weight: 500,
        effect: ''
    },
    MEDIUM: {
        id: 'MEDIUM',
        label: 'Medium',
        icon: TIER_ICONS.MEDIUM,
        color: '#34d399', // Emerald/Mint
        bg: 'rgba(52, 211, 153, 0.1)',
        weight: 600,
        effect: 'hover:shadow-[0_0_8px_rgba(52,211,153,0.4)] transition-shadow'
    },
    CHAD: {
        id: 'CHAD',
        label: 'Chad',
        icon: TIER_ICONS.CHAD,
        color: '#fbbf24', // Amber/Gold
        bg: 'rgba(251, 191, 36, 0.1)',
        border: '1px solid rgba(251, 191, 36, 0.3)',
        weight: 700,
        effect: 'shadow-[0_0_10px_rgba(251,191,36,0.2)]' // Static Glow
    },
    WHALE: {
        id: 'WHALE',
        label: 'Whale',
        icon: TIER_ICONS.WHALE,
        color: '#c084fc', // Violet
        isGradient: true,
        bg: 'linear-gradient(135deg, #22d3ee 0%, #c084fc 100%)',
        weight: 800,
        effect: 'animate-pulse-slow shadow-[0_0_15px_rgba(192,132,252,0.4)]' // Slow Shimmer
    }
};

export const MOOD_CONFIG = {
    QUIET: { color: '#9ca3af', label: 'Quiet' },
    ACTIVE: { color: '#34d399', label: 'Active' },
    HEATED: { color: '#fbbf24', label: 'Heated' },
    EUPHORIC: { color: '#f472b6', label: 'Euphoric' } // Pink/Magenta
};

export function getTierStyle(tier) {
    const key = (tier || 'NONE').toUpperCase();
    return TIER_CONFIG[key] || TIER_CONFIG.NONE;
}
