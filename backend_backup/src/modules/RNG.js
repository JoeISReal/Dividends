import { ITEMS } from '../models/Inventory.js';

const RARITY_WEIGHTS = {
    Common: 50,
    Uncommon: 30,
    Rare: 15,
    Epic: 4,
    Mythic: 1
};

export class RNG {
    static rollRarity() {
        const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
            random -= weight;
            if (random <= 0) {
                return rarity;
            }
        }
        return 'Common'; // Fallback
    }

    static generateReward() {
        const rarity = this.rollRarity();
        // Filter items by rarity
        const possibleItems = Object.values(ITEMS).filter(item => item.rarity === rarity);

        if (possibleItems.length === 0) {
            // Fallback if no items of that rarity exist (shouldn't happen with current data)
            return Object.values(ITEMS)[0];
        }

        const randomIndex = Math.floor(Math.random() * possibleItems.length);
        return possibleItems[randomIndex];
    }
}
