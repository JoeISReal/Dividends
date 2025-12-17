
// Phase 3: Safe Perks Registry
// Defines purely cosmetic/UX unlocks. NO EV/Math modifiers.

export const PERK_TYPES = {
    UI: 'UI',         // Themes, layouts, visual toggles
    SOCIAL: 'SOCIAL', // Titles, flair, chat features
    ACCESS: 'ACCESS'  // Beta features, private lobbies
};

export const PERK_DEFINITIONS = [
    // --- LEVEL 5 ---
    {
        id: 'theme_dark_pro',
        label: 'Pro Dark Theme',
        description: 'Access to the high-contrast Pro Dark UI theme.',
        unlockLevel: 5,
        type: PERK_TYPES.UI,
        effect: { type: 'theme_unlock', value: 'dark_pro' }
    },
    {
        id: 'title_novice',
        label: 'Title: Novice Degen',
        description: 'Equip the "Novice Degen" title on leaderboards.',
        unlockLevel: 5,
        type: PERK_TYPES.SOCIAL,
        effect: { type: 'title_unlock', value: 'Novice Degen' }
    },

    // --- LEVEL 10 ---
    {
        id: 'chart_layout_save',
        label: 'Saved Layouts',
        description: 'ability to save and load custom chart configurations.',
        unlockLevel: 10,
        type: PERK_TYPES.UI,
        effect: { type: 'feature_unlock', feature: 'saved_layouts' }
    },
    {
        id: 'arena_preset_1',
        label: 'Arena Preset Slot 1',
        description: 'Save your favorite bet size/leverage combo.',
        unlockLevel: 10,
        type: PERK_TYPES.UI,
        effect: { type: 'preset_slot', count: 1 }
    },

    // --- LEVEL 20 ---
    {
        id: 'title_ape',
        label: 'Title: Ape',
        description: 'Equip the "Ape" title.',
        unlockLevel: 20,
        type: PERK_TYPES.SOCIAL,
        effect: { type: 'title_unlock', value: 'Ape' }
    },
    {
        id: 'watchlist_extended',
        label: 'Extended Watchlist',
        description: 'Track up to 10 tokens in your sidebar.',
        unlockLevel: 20,
        type: PERK_TYPES.UI,
        effect: { type: 'watchlist_cap', value: 10 }
    }
];

export function getPerksForLevel(level) {
    return PERK_DEFINITIONS.filter(p => p.unlockLevel <= level);
}

export function getNextUnlock(currentLevel) {
    return PERK_DEFINITIONS
        .filter(p => p.unlockLevel > currentLevel)
        .sort((a, b) => a.unlockLevel - b.unlockLevel)[0];
}
