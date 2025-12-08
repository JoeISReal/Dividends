import { EVENTS } from '../data/GameData.js';

export class EventSystem {
    static checkForEvent() {
        // 5% chance per check (called every few seconds)
        if (Math.random() > 0.05) return null;

        const totalWeight = EVENTS.reduce((acc, e) => acc + e.probability, 0);
        let random = Math.random() * totalWeight;

        for (const event of EVENTS) {
            random -= event.probability;
            if (random <= 0) {
                return event;
            }
        }
        return null;
    }
}
