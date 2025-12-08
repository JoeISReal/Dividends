import { STREAMS, UPGRADES } from '../data/GameData.js';

export class Economy {
    // Calculate total yield per second
    static calculateYield(player) {
        let totalYield = 0;

        // 1. Base Stream Yield
        STREAMS.forEach(stream => {
            const quantity = player.streams[stream.id] || 0;
            if (quantity > 0) {
                let streamYield = stream.baseYield * quantity;

                // Apply Stream-specific multipliers
                player.upgrades.forEach(upId => {
                    const upgrade = UPGRADES.find(u => u.id === upId);
                    if (upgrade && upgrade.target === stream.id && upgrade.type === 'multiplier') {
                        streamYield *= upgrade.value;
                    }
                });

                totalYield += streamYield;
            }
        });

        // 2. Global Multipliers (Upgrades)
        player.upgrades.forEach(upId => {
            const upgrade = UPGRADES.find(u => u.id === upId);
            if (upgrade && upgrade.target === 'global' && upgrade.type === 'multiplier') {
                totalYield *= upgrade.value;
            }
        });

        // 3. Prestige Multiplier
        totalYield *= player.prestige.multiplier;

        return totalYield;
    }

    // Calculate cost of next stream purchase
    static getStreamCost(streamId, currentQuantity) {
        const stream = STREAMS.find(s => s.id === streamId);
        if (!stream) return Infinity;
        return Math.floor(stream.baseCost * Math.pow(stream.costMultiplier, currentQuantity));
    }

    // Process Prestige Reset
    static calculatePrestigeReward(lifetimeYield) {
        // Formula: (Lifetime / 1,000,000) ^ 0.5
        if (lifetimeYield < 1000000) return 0;
        return Math.sqrt(lifetimeYield / 1000000);
    }

    static prestige(player) {
        const newMultiplier = this.calculatePrestigeReward(player.lifetimeYield);
        if (newMultiplier <= player.prestige.multiplier) {
            return { success: false, reason: 'Not enough progress to prestige' };
        }

        // Reset Game State
        player.yield = 0;
        player.streams = {};
        player.upgrades = [];
        player.startTime = Date.now();

        // Apply new multiplier
        player.prestige.multiplier = Math.floor(newMultiplier * 100) / 100; // 2 decimals
        player.prestige.resets += 1;

        player.save();
        return { success: true, player };
    }
}
