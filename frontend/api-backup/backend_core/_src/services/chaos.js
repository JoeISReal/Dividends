
// Phase 4: Chaos Engineering Service
// Simulates failures and latency to test resilience.

// Config via Env (with defaults)
const CHAOS_MODE = process.env.CHAOS_MODE === 'true';
const FAIL_RATE = parseFloat(process.env.CHAOS_FAIL_RATE || '0.10');
const DELAY_MIN = parseInt(process.env.CHAOS_DELAY_MS_MIN || '200');
const DELAY_MAX = parseInt(process.env.CHAOS_DELAY_MS_MAX || '800');
const STALE_SNAPSHOT = process.env.CHAOS_STALE_SNAPSHOT === 'true';

export const chaos = {
    isEnabled: CHAOS_MODE,

    /**
     * Randomly delays execution to simulate network latency
     */
    async maybeDelay(label) {
        if (!CHAOS_MODE) return;
        const delay = Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN + 1)) + DELAY_MIN;
        if (delay > 500) {
            console.log(`[CHAOS] ${label}: Deliberate delay of ${delay}ms`);
        }
        return new Promise(resolve => setTimeout(resolve, delay));
    },

    /**
     * Randomly throws an error to simulate upstream failure
     */
    maybeFail(label) {
        if (!CHAOS_MODE) return;
        if (Math.random() < FAIL_RATE) {
            console.warn(`[CHAOS] ${label}: Deliberate FAILURE triggered!`);
            throw new Error(`[CHAOS] Simulated failure for ${label}`);
        }
    },

    /**
     * Returns true if we should deliberately return stale data
     */
    shouldSimulateStale() {
        return CHAOS_MODE && STALE_SNAPSHOT;
    },

    /**
     * Debug status
     */
    getStatus() {
        return {
            enabled: CHAOS_MODE,
            failRate: FAIL_RATE,
            delayMin: DELAY_MIN,
            delayMax: DELAY_MAX,
            staleSnapshot: STALE_SNAPSHOT
        };
    }
};
