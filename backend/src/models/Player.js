import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data.json');

export class Player {
    constructor(data) {
        this.yield = data.yield || 0;
        this.lifetimeYield = data.lifetimeYield || 0;
        this.streams = data.streams || {}; // { streamId: quantity }
        this.upgrades = Array.isArray(data.upgrades) ? data.upgrades : []; // [upgradeId]
        this.prestige = data.prestige || { multiplier: 1, resets: 0 };
        this.lastActive = data.lastActive || Date.now();
        this.startTime = data.startTime || Date.now();
    }

    static load() {
        if (!fs.existsSync(DATA_PATH)) {
            return new Player({});
        }
        try {
            const data = JSON.parse(fs.readFileSync(DATA_PATH));
            return new Player(data);
        } catch (e) {
            console.error("Failed to load save, resetting:", e);
            return new Player({});
        }
    }

    async save() {
        this.lastActive = Date.now();
        try {
            await fs.promises.writeFile(DATA_PATH, JSON.stringify(this, null, 2));
        } catch (e) {
            console.error("Failed to save player data:", e);
        }
    }

    // Helper to safely add yield
    addYield(amount) {
        if (isNaN(amount) || amount < 0) return;
        this.yield += amount;
        this.lifetimeYield += amount;
    }

    // Helper to spend
    spend(amount) {
        if (this.yield >= amount) {
            this.yield -= amount;
            return true;
        }
        return false;
    }
}
