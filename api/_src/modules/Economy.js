import { STREAMS, UPGRADES } from '../data/GameData.js';

export class Economy {
    // Calculate total yield per second
    static calculateYield(player) {
        let totalYield = 0;
        const now = Date.now();

        STREAMS.forEach(stream => {
            const quantity = player.streams[stream.id] || 0;
            if (quantity > 0) {
                let streamYield = stream.baseYield * quantity;

                // 1. Decay (Decay Streams Only)
                if (stream.category === 'decay' && stream.decayRate) {
                    // Ensure stream age tracking exists
                    if (!player.streamAges[stream.id]) {
                        player.streamAges[stream.id] = { ageSec: 0, lastTick: now };
                    }

                    const ageSec = player.streamAges[stream.id].ageSec || 0;
                    // Decay formula: linear or exponential? Spec says "Yield decays per cycle".
                    // Let's assume simple compound decay: base * (1 - decayRate)^age_minutes
                    // Or simple linear decay factor.
                    // "Loses efficiency over time".
                    // Let's go with efficiency multiplier = 1 / (1 + decayRate * age)
                    // Or yield = yield * (1 - decayRate * age). (Can go negative? No).
                    // Let's use `Math.exp(-decayRate * age)` for smooth decay.
                    const decayFactor = Math.exp(-stream.decayRate * (ageSec / 60)); // age in minutes
                    streamYield *= decayFactor;
                }

                // 2. Synergy (Bonus layer)
                if (stream.category === 'synergy' && stream.synergyTags) {
                    // Check for synergies
                    let synergyBonus = 0;
                    // Example: 'volatility_boost' checks if volatility is high or if user owns volatile streams
                    // Example: 'volume_scale' checks total yield or streams count
                    // Since tags are generic strings, let's hardcode some simple checks for now based on tags
                    // Real implementation would be better event-driven, but here we scan.

                    if (stream.synergyTags.includes('volatility_boost')) {
                        // Bonus based on volatility
                        const volatility = this.calculateVolatility(player);
                        if (volatility > 1.0) synergyBonus += (volatility - 1.0);
                    }
                    if (stream.synergyTags.includes('volume_scale')) {
                        // Bonus based on total stream count
                        const totalStreams = Object.values(player.streams).reduce((a, b) => a + b, 0);
                        if (totalStreams > 50) synergyBonus += 0.2;
                    }
                    if (stream.synergyTags.includes('stake_multiplier')) {
                        // Bonus based on treasury/liquidity
                        if (player.streams['liquidity_pool'] > 0) synergyBonus += 0.1;
                        if (player.streams['dao_treasury'] > 0) synergyBonus += 0.15;
                    }

                    streamYield *= (1 + synergyBonus);
                }

                // 3. Upgrades
                player.upgrades.forEach(upId => {
                    const upgrade = UPGRADES.find(u => u.id === upId);
                    if (upgrade && upgrade.target === stream.id && upgrade.type === 'multiplier') {
                        streamYield *= upgrade.value;
                    }
                });

                totalYield += streamYield;
            }
        });

        // 4. Global Multipliers
        player.upgrades.forEach(upId => {
            const upgrade = UPGRADES.find(u => u.id === upId);
            if (upgrade && upgrade.target === 'global' && upgrade.type === 'multiplier') {
                totalYield *= upgrade.value;
            }
        });

        // 5. Prestige
        totalYield *= player.prestige.multiplier;

        return totalYield;
    }

    // --- New Mechanics ---

    static calculateStability(player) {
        let stability = 100; // Base stability
        STREAMS.forEach(stream => {
            const qty = player.streams[stream.id] || 0;
            if (qty > 0 && stream.stabilityImpact) {
                // Diminishing returns on stability impact? Or linear? 
                // Spec says "Amplifies stability drain".
                // Let's make it linear for now as per simple formula request.
                stability += (stream.stabilityImpact * qty);
            }
        });
        return Math.max(0, stability); // Cap at 0? Or allow negative for "Rugged"?
    }

    static calculateVolatility(player) {
        let volatility = 1.0; // Base 100%
        STREAMS.forEach(stream => {
            const qty = player.streams[stream.id] || 0;
            if (qty > 0 && stream.volatilityModifier) {
                // Additive modifier
                volatility += (stream.volatilityModifier * qty);
            }
        });
        return Math.max(0.1, volatility);
    }

    // XP & Leveling
    // Formula: XP Required = baseXP * log(level + 1) ^ 1.4
    // We need to determine Level from XP.
    // Let's use a simple approximate reverse or iterative check since max level isn't insane.
    // Or just define `XP to Next Level` and let the frontend handle the bar.
    // Use `getLevelFromXP`
    static getLevelFromXP(xp) {
        // Approximate inverse of the curve? 
        // Let's iterate:
        // Level 1 require 100 XP.
        // Level 2 require 100 * log(3)^1.4 ...

        let level = 0;
        let requiredXP = 0;
        // Optimization: Formula could be `Level = ...`. 
        // Simple linear-ish approximation for now to match "Logarithmic XP scaling".
        // "XP Required = baseXP * log(level + 1) ^ 1.4" -> This likely means COST of next level.
        // Cumulative XP for level L = Sum(Costs).

        // Let's implement a simple threshold check.
        // Cost(L) = 1000 * Math.pow(Math.log2(L + 2), 1.4)

        let currentXP = xp;
        while (true) {
            const nextLevelCost = Math.floor(1000 * Math.pow(Math.log2(level + 2), 1.4));
            if (currentXP >= nextLevelCost) {
                currentXP -= nextLevelCost;
                level++;
            } else {
                break;
            }
            if (level > 1000) break; // Safety break
        }
        return level;
    }

    // Returns XP needed for NEXT level
    static getXPToNextLevel(level) {
        return Math.floor(1000 * Math.pow(Math.log2(level + 2), 1.4));
    }


    // Fatigue System
    static processFatigue(player, elapsedSeconds) {
        // Increase fatigue based on Stability Pressure
        // If stability < 50, fatigue grows faster.
        const stability = this.calculateStability(player);
        const fatigueRate = stability < 50 ? (50 - stability) / 100 : 0; // Growth if unstable

        if (fatigueRate > 0) {
            player.fatigue = Math.min(100, player.fatigue + (fatigueRate * elapsedSeconds));
        } else {
            // Recover if stable
            player.fatigue = Math.max(0, player.fatigue - (0.5 * elapsedSeconds));
        }

        // Update stream ages for decay
        Object.keys(player.streamAges).forEach(sId => {
            player.streamAges[sId].ageSec += elapsedSeconds;
            player.streamAges[sId].lastTick = Date.now();
        });

        player.lastFatigueUpdate = Date.now();
    }


    // Grant XP with Fatigue Penalty
    static addXP(player, amount) {
        // Fatigue reduces XP efficiency
        // 0 Fatigue = 100% efficiency
        // 100 Fatigue = 20% efficiency (extreme penalty but not 0)
        const efficiency = 1.0 - (player.fatigue * 0.008); // Max 80% reduction at 100 fatigue
        const effectiveEfficiency = Math.max(0.2, efficiency);

        const actualXP = Math.floor(amount * effectiveEfficiency);
        player.xp += actualXP;

        return actualXP;
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
        player.upgrades = { clickLevel: 0, globalLevel: 0 }; // Fix: Use object not array
        player.startTime = Date.now();

        // Apply new multiplier
        player.prestige.multiplier = Math.floor(newMultiplier * 100) / 100; // 2 decimals
        player.prestige.resets += 1;

        // player.save(); // handled by caller
        return { success: true, player };
    }
}
