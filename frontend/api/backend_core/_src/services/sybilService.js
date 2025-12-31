
// Phase 3: Anti-Sybil Heuristics (Soft Defense)
// Monitors behavior patterns without hard banning.

const RISK_THRESHOLDS = {
    HIGH: 75,
    MEDIUM: 50,
    LOW: 25
};

const SUSPICIOUS_PATTERNS = {
    RAPID_CLICKS_MS: 100, // Clicks faster than 100ms
    PERFECT_INTERVAL_VARIANCE: 5, // < 5ms variance suggesting script
    IDENTICAL_BETS: 5 // 5 identical bets in a row
};

class SybilService {
    constructor() {
        this.userHistory = new Map(); // In-memory for demo; use Redis in prod
    }

    /**
     * Assess risk for a specific action
     * @param {string} userId 
     * @param {string} actionType 'CLICK' | 'BET' | 'AFK'
     * @param {object} metadata { amount, timestamp }
     */
    assessActionRisk(userId, actionType, metadata) {
        if (!this.userHistory.has(userId)) {
            this.userHistory.set(userId, {
                clicks: [],
                bets: [],
                riskScore: 0,
                flags: []
            });
        }

        const history = this.userHistory.get(userId);
        const now = Date.now();

        if (actionType === 'CLICK') {
            this._analyzeClickPattern(history, now);
        } else if (actionType === 'BET') {
            this._analyzeBetPattern(history, metadata, now);
        }

        return {
            riskScore: history.riskScore,
            flags: history.flags
        };
    }

    _analyzeClickPattern(history, now) {
        history.clicks.push(now);
        if (history.clicks.length > 20) history.clicks.shift(); // Keep last 20

        if (history.clicks.length < 5) return;

        // check generic speed (CPM equivalent)
        const recent = history.clicks.slice(-10);
        const duration = recent[recent.length - 1] - recent[0];
        if (duration < 1000) { // 10 clicks in 1 second
            this._addFlag(history, 'SUPERHUMAN_SPEED', 20);
        }

        // check variance (Robotic rhythm)
        const intervals = [];
        for (let i = 1; i < recent.length; i++) {
            intervals.push(recent[i] - recent[i - 1]);
        }
        const variance = this._calculateVariance(intervals);
        if (variance < SUSPICIOUS_PATTERNS.PERFECT_INTERVAL_VARIANCE) {
            this._addFlag(history, 'ROBOTIC_RHYTHM', 15);
        }
    }

    _analyzeBetPattern(history, metadata, now) {
        history.bets.push({ amount: metadata.amount, time: now });
        if (history.bets.length > 10) history.bets.shift();

        // check identical inputs
        const last5 = history.bets.slice(-5);
        if (last5.length === 5) {
            const allSame = last5.every(b => b.amount === last5[0].amount);
            if (allSame) {
                // Not necessarily bad, but combined with speed it is
                this._addFlag(history, 'STATIC_BETTING', 5);
            }
        }
    }

    _addFlag(history, flag, weight) {
        if (!history.flags.includes(flag)) {
            history.flags.push(flag);
            history.riskScore = Math.min(100, history.riskScore + weight);
            console.log(`[Sybil] Flag added: ${flag} (Score: ${history.riskScore})`);
        }
    }

    _calculateVariance(arr) {
        if (arr.length === 0) return 0;
        const mean = arr.reduce((a, b) => a + b) / arr.length;
        return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / arr.length);
    }
}

export const sybilService = new SybilService();
