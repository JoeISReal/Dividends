import React from 'react';
import { getTier, HOLDER_TIERS } from '../cosmetics/registry';

export function TierBadge({ balance, tierOverride, tier, showIcon = true, showName = true, size = 'sm' }) {
    let resolvedTier = tierOverride;

    // Handle legacy 'tier' prop (string ID)
    if (!resolvedTier && tier) {
        resolvedTier = Object.values(HOLDER_TIERS).find(t => t.id === tier);
    }

    // Fallback to balance logic
    if (!resolvedTier) {
        resolvedTier = getTier(balance || 0);
    }

    return (
        <span className={`tier-badge ${resolvedTier.className}`}>
            {showIcon && <span>{resolvedTier.icon}</span>}
            {showName && <span>{resolvedTier.name}</span>}
        </span>
    );
}
