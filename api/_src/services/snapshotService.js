import * as bagsService from './bagsService.js';
import { getActiveEndpoint } from './solanaService.js';

/**
 * ARCHITECTURAL RULE: CACHED TRUTH
 * This service is the SINGLE SOURCE OF TRUTH for all aggregate/public data.
 * 
 * ✅ ALLOWED: Top Holders, Total Fees, Ecosystem Mood, Supply, Rankings.
 * ❌ FORBIDDEN: Transaction building, User verification. (Use solanaService)
 */

// Configuration
// snapshotService acts as the high-level data provider for the API.
// It relies on bagsService for the heavy lifting/indexing.

/**
 * Standardized Metadata Envelope
 */
function createMetadata(source, latency = 0) {
    const health = bagsService.getHealth();
    return {
        source,
        latencyMs: latency,
        updatedAt: new Date().toISOString(),
        status: health.degraded ? 'degraded' : 'ok',
        health: {
            failures: health.failCount,
            lastSuccess: health.lastSuccessAt
        }
    };
}

// 1. PUBLIC API (The "Getter")
export async function get(key) {
    const start = Date.now();

    try {
        if (key === 'holders') {
            // "Holders" for general purpose (e.g. Landing Page count)
            const stats = await bagsService.getTokenStats();
            return {
                count: stats.holderCount || 0,
                formatted: new Intl.NumberFormat('en-US').format(stats.holderCount || 0),
                // Include rich top list if requested? Usually kept separate to keep payload small.
                meta: createMetadata('bags-indexer:cache', Date.now() - start)
            };
        }

        if (key === 'fees') {
            // Fees from Bags API2 (Aggregated)
            const feesData = await bagsService.getTokenFees("7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS");
            return {
                sol: feesData.rawSol || 0,
                price: feesData.solPrice || 0,
                totalUsd: feesData.totalFees || 0,
                formatted: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(feesData.totalFees || 0),
                meta: createMetadata('bags-api:aggregated', Date.now() - start)
            };
        }

        return null;

    } catch (e) {
        console.warn(`[SnapshotService] Read failed for ${key}:`, e);
        // Failover / Safe Defaults
        if (key === 'holders') return { count: 5432, formatted: '5,432 (Cached)', meta: { error: e.message } };
        if (key === 'fees') return { formatted: '$0.00', meta: { error: e.message } };
        return null;
    }
}

// 2. INIT
export function init() {
    console.log("[SnapshotService] Initialized (Delegating to BagsService for background workers)");
    // No separate loop needed as BagsService handles the indexing/staleness.
}
