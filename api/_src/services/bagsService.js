
import { ObjectId } from 'mongodb';
import { Connection, PublicKey } from '@solana/web3.js';
import { chaos } from './chaos.js';
import * as marketService from './marketService.js';
import * as jupiterService from './jupiterService.js';
import * as solanaService from './solanaService.js';

// Configuration
const DIVIDENDS_MINT = "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const SNAPSHOT_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const STALE_THRESHOLD_MS = 12 * 60 * 60 * 1000; // 12 hours (Guardrail)

// Constants for Analytics
const MOOD_THRESHOLDS = {
    HEATED_VOLUME: 25000,
    ACTIVE_VOLUME: 5000,
    QUIET_VOLUME: 1000,
    HIGH_CHURN: 10,  // Approx count per snapshot
    HIGH_DELTA: 0.05
};

// In-memory cache
let _db = null;
let _currentSnapshot = null;
let _tierThresholds = {
    whale: 0,
    chad: 0,
    medium: 0
};
let _health = {
    lastSuccessAt: null,
    failCount: 0,
    degraded: false
};

/**
 * Initialize the Bags Service with the Database connection
 */
export async function init(db) {
    _db = db;
    console.log("[BagsService] Initializing...");

    // 1. Load latest snapshot from DB
    await loadLatestSnapshot();

    // 2. If no snapshot or stale, trigger refresh (background)
    if (shouldRefreshSnapshot()) {
        refreshSnapshot().catch(err => console.error("[BagsService] Background refresh failed:", err));
    }

    // 3. Schedule periodic refresh
    setInterval(() => {
        // Chaos: Maybe delay the scheduled refresh
        chaos.maybeDelay('snapshot_schedule').then(() => {
            refreshSnapshot().catch(err => console.error("[BagsService] Scheduled refresh failed:", err));
        });
    }, SNAPSHOT_INTERVAL_MS);
}

/**
 * public: Get a user's Tier and Approx Balance
 */
export function getHolderTier(walletAddress) {
    // Guardrail: Safe default if no snapshot exists
    if (!_currentSnapshot) {
        // Return a valid empty state instead of potentially crashing later
        return { tier: 'MEMBER', balanceApprox: 0, lastSync: new Date().toISOString(), stale: true };
    }

    // Guardrail: Check for staleness
    const now = Date.now();
    const snapTime = new Date(_currentSnapshot.timestamp).getTime();
    const age = now - snapTime;
    const isStale = age > STALE_THRESHOLD_MS || chaos.shouldSimulateStale();

    const holder = _currentSnapshot.holders[walletAddress];
    if (!holder) {
        return { tier: 'NONE', balanceApprox: 0, lastSync: _currentSnapshot.timestamp, stale: isStale };
    }

    return {
        tier: calculateTier(holder.balance),
        balanceApprox: holder.balance,
        lastSync: _currentSnapshot.timestamp,
        stale: isStale
    };
}

/**
 * public: Get the current leaderboard/stats
 */
export async function getLeaderboard() {
    if (!_currentSnapshot) return { updated: null, topHolders: [] };

    // 1. Get raw top holders (up to 100)
    const topRaw = _currentSnapshot.sortedHolders.slice(0, 100);
    const wallets = topRaw.map(h => h.wallet);

    // 2. Fetch Display Names from DB
    const userMap = {};
    if (_db) {
        try {
            const users = await _db.collection('users')
                .find({ handle: { $in: wallets } })
                .project({ handle: 1, displayName: 1 })
                .toArray();

            users.forEach(u => {
                if (u.displayName) userMap[u.handle] = u.displayName;
            });
        } catch (e) {
            console.error("[BagsService] User mapping failed:", e);
        }
    }

    // KNOWN WALLETS OVERRIDE
    const KNOWN_WALLETS = {
        'HLnpSz9h2S4hiLQ43rnSD9XkcUThA7B8hQMKmDaiTLcC': { name: 'Meteora Pool Authority', tier: 'liquidity' }
    };

    // 3. Merge & Return
    return {
        updatedAt: _currentSnapshot.timestamp,
        topHolders: topRaw.map(h => {
            const known = KNOWN_WALLETS[h.wallet];
            return {
                wallet: h.wallet,
                username: (known ? known.name : null) || userMap[h.wallet] || null, // Priority: Known > DB > Null
                tier: (known ? known.tier : null) || calculateTier(h.balance),
                balanceApprox: h.balance,
                share: (h.balance / 1000000000) * 100
            };
        })
    };
}

/**
 * Public: Get Ecosystem Context/Mood
 */
export function getEcosystemMood() {
    if (!_currentSnapshot) {
        return {
            mood: 'QUIET',
            tags: [],
            updatedAt: new Date().toISOString()
        };
    }

    const metrics = _currentSnapshot.metrics || {};
    return {
        mood: metrics.mood || 'QUIET',
        tags: metrics.tags || [],
        metrics: {
            top10Share: metrics.top10Share,
            churnCount: metrics.churnCount,
            netFlow: metrics.netFlow,
            volume24h: _currentSnapshot.market?.volume24h || 0
        },
        updatedAt: _currentSnapshot.timestamp,
        stale: (Date.now() - new Date(_currentSnapshot.timestamp).getTime()) > STALE_THRESHOLD_MS
    };
}

/**
 * public: Get Trending Tokens (Proxy to Market Service for now)
 * Returns a list of trending tokens in the ecosystem
 */
export async function getTrendingTokens() {
    // Fallback to Jupiter/Market service until specific Bags Trending endpoint is confirmed
    // The user wants "what's trending on the bags app", which is effectively market trending data for now.
    try {
        const trending = await jupiterService.fetchTrendingTokens();
        return trending || [];
    } catch (e) {
        console.error("[BagsService] Failed to fetch trending:", e);
        return [];
    }
}

// --- Internal Logic ---

function calculateTier(balance) {
    if (balance <= 0) return 'shrimp';
    if (balance >= 10000000) return 'kraken';
    if (balance >= 1000000) return 'whale';
    if (balance >= 500000) return 'orca';
    if (balance >= 100000) return 'shark';
    if (balance >= 50000) return 'dolphin';
    if (balance >= 10000) return 'crab';
    return 'shrimp';
}

async function loadLatestSnapshot() {
    if (!_db) return;
    try {
        const snap = await _db.collection('bags_snapshots')
            .find({})
            .sort({ timestamp: -1 })
            .limit(1)
            .next();

        if (snap) {
            _currentSnapshot = processSnapshotForCache(snap);
            _tierThresholds = snap.thresholds;
            console.log(`[BagsService] Loaded snapshot from ${snap.timestamp.toISOString()}`);
        }
    } catch (e) {
        console.error("[BagsService] Failed to load snapshot:", e);
    }
}

function processSnapshotForCache(snap) {
    const holdersMap = {};
    if (snap.holders) {
        snap.holders.forEach(h => {
            holdersMap[h.wallet] = h;
        });
    }

    const sorted = snap.holders ? [...snap.holders].sort((a, b) => b.balance - a.balance) : [];

    return {
        timestamp: snap.timestamp,
        holders: holdersMap,
        sortedHolders: sorted,
        totalHolders: snap.totalHolders || 0,
        thresholds: snap.thresholds || { whale: 0, chad: 0, medium: 0 },
        market: snap.market || {},
        metrics: snap.metrics || {}
    };
}

function shouldRefreshSnapshot() {
    if (!_currentSnapshot) return true;
    if ((_currentSnapshot.totalHolders || 0) === 0) return true; // Force retry if empty
    const age = Date.now() - new Date(_currentSnapshot.timestamp).getTime();
    return age > SNAPSHOT_INTERVAL_MS;
}

/**
 * Fetches fresh data, computes thresholds, saves to DB
 */
async function refreshSnapshot() {
    console.log("[BagsService] Refreshing snapshot...");

    await chaos.maybeDelay('snapshot_refresh');
    chaos.maybeFail('snapshot_refresh');

    // 1. Fetch Holders via RPC (Centralized Service)
    let holdersList = [];
    try {
        // Try heavy scan first
        holdersList = await solanaService.getAllHolders();
        console.log(`[BagsService] Heavy scan success. Count: ${holdersList.length}`);
    } catch (e) {
        console.warn(`[BagsService] Heavy scan failed (${e.message}). Falling back to Light Scan...`);
        try {
            holdersList = await solanaService.getTopHolders();
            console.log(`[BagsService] Light scan success. Count: ${holdersList.length}`);
        } catch (e2) {
            console.error(`[BagsService] Light scan failed too: ${e2.message}`);
            _health.failCount++;
            _health.degraded = true;
            return; // Abort
        }
    }

    // 2. Fetch Market Data (Real - DexScreener)
    const realMarketData = await marketService.fetchTokenData(DIVIDENDS_MINT);
    const volume24h = realMarketData?.volume24h || 5000;

    if (!holdersList || holdersList.length === 0) {
        console.warn("[BagsService] No holders found (RPC error?), skipping update.");
        return;
    }

    holdersList.sort((a, b) => b.balance - a.balance);
    const totalHolders = holdersList.length;

    // 3. Compute Thresholds (Dynamic Tiers)
    const whaleMin = holdersList[Math.max(0, Math.min(99, Math.ceil(totalHolders * 0.01) - 1))]?.balance || 0;
    const chadMin = holdersList[Math.max(0, Math.ceil(totalHolders * 0.10) - 1)]?.balance || 0;
    const medMin = holdersList[Math.max(0, Math.ceil(totalHolders * 0.50) - 1)]?.balance || 0;

    // 4. Compute Metrics & Mood
    const metrics = analyzeSnapshot(holdersList, _currentSnapshot, volume24h);

    const snapshot = {
        timestamp: new Date(),
        totalHolders,
        holders: holdersList,
        sortedHolders: holdersList, // Store sorted for easier debugging, though adds size
        thresholds: {
            whale: whaleMin,
            chad: chadMin,
            medium: medMin
        },
        metrics: metrics,
        market: {
            volume24h,
            realData: realMarketData
        }
    };

    // 5. Save & Cache
    if (_db) {
        // Optimization: Don't store full sorted list if it's huge, but for <2000 holders it's fine.
        await _db.collection('bags_snapshots').insertOne(snapshot);
    }

    _currentSnapshot = processSnapshotForCache(snapshot);
    _tierThresholds = snapshot.thresholds;

    // Health Update
    _health.lastSuccessAt = new Date();
    _health.failCount = 0;
    _health.degraded = false;

    console.log(`[BagsService] Snapshot refreshed. Mood: ${metrics.mood} Tags: ${metrics.tags?.join(',')}`);
}

export function getHealth() {
    return { ..._health };
}

// RPC Logic moved to solanaService.js

function analyzeSnapshot(currentHolders, previousSnapshot, volume24h) {
    const totalSupply = 1000000000;

    // 1. Current State Metrics
    const top10Balance = currentHolders.slice(0, 10).reduce((acc, h) => acc + h.balance, 0);
    const top10Share = top10Balance / totalSupply;

    const top50Balance = currentHolders.slice(0, 50).reduce((acc, h) => acc + h.balance, 0);
    const top50Share = top50Balance / totalSupply;

    // 2. Delta & Flow
    let netFlow = 0;
    let churnCount = 0;
    let prevTop10Share = top10Share; // default if no prev

    if (previousSnapshot && previousSnapshot.holders) {
        // Net Flow Calculation (Top 50 focused or Global?)
        // "Aggregate netFlow = sum(balanceDelta)" usually implies for the tracked set or meaningful movers.
        // Let's track Net Flow of the Top 50 to see "Smart Money" direction.
        // Or simply sum of ALL balance changes? Sum of all balance changes is always 0 (transfers).
        // It must mean "Net Flow into/out of Top Holders" or specific wallets.
        // Let's assume Net Flow of Top 50.

        const prevHoldersMap = previousSnapshot.holders;
        const currentTop50 = currentHolders.slice(0, 50);

        // Churn: Count how many of Top 50 were NOT in Top 50 last time.
        // Need to know Previous Top 50 list.
        const prevTop50List = previousSnapshot.sortedHolders ? previousSnapshot.sortedHolders.slice(0, 50) : [];
        const prevTop50Set = new Set(prevTop50List.map(h => h.wallet));

        currentTop50.forEach(curr => {
            if (!prevTop50Set.has(curr.wallet)) {
                churnCount++;
            }
            // Net Flow calculation logic:
            // Sum of (Current Bal - Previous Bal) for these Top 50 wallets.
            const prevBal = prevHoldersMap[curr.wallet]?.balance || 0;
            netFlow += (curr.balance - prevBal);
        });

        // Also check if any left the top 50 (already captured by churn count technically if size is constant, 
        // but prompt says "addedWallets + removedWallets").
        // If 5 entered, 5 left. So churnCount (entrants) * 2? Or just count entrants?
        // Prompt: "churnCount = addedWallets + removedWallets". 
        // If Top 50 size is constant, Added == Removed. So Churn = 2 * Entrants.
        churnCount = churnCount * 2;

        const prevTop10Bal = prevTop50List.slice(0, 10).reduce((acc, h) => acc + h.balance, 0);
        prevTop10Share = prevTop10Bal / totalSupply;
    }

    // 3. Mood Derivation
    let mood = 'QUIET';
    const tags = [];

    // Volume Rules
    if (volume24h > MOOD_THRESHOLDS.HEATED_VOLUME) mood = 'HEATED';
    else if (volume24h > MOOD_THRESHOLDS.ACTIVE_VOLUME) mood = 'ACTIVE';

    // Churn Rules
    if (churnCount >= MOOD_THRESHOLDS.HIGH_CHURN) {
        if (Math.abs(netFlow) > 1000000) { // High flow + Churn
            mood = 'HEATED';
            tags.push('VOLATILE');
        } else {
            mood = 'ACTIVE';
            tags.push('ROTATING');
        }
    }

    // Concentration Rules
    if (top10Share > prevTop10Share + 0.005) {
        tags.push('CONCENTRATED');
        if (mood === 'QUIET') mood = 'ACTIVE';
    } else if (top10Share < prevTop10Share - 0.005) {
        tags.push('DISTRIBUTING');
    }

    // Net Flow Rules
    if (netFlow > 500000) tags.push('ACCUMULATING');
    else if (netFlow < -500000) tags.push('DUMPING');

    return {
        top10Share,
        top50Share,
        netFlow,
        churnCount,
        mood,
        tags
    };
}

// Legacy exports for compatibility
export async function getTokenStats(mint) {
    return {
        price: _currentSnapshot?.market?.realData?.price || 0,
        holderCount: _currentSnapshot?.totalHolders || 0,
        mood: getEcosystemMood().mood
    };
}
export async function getTokenFees(mint) {
    try {
        console.log("[BagsService] 1. Fetching Fees from API2...");

        // 1. Fetch Fees (Lamports) from Hidden Endpoint
        const res = await fetch(`https://api2.bags.fm/api/v1/token-launch/lifetime-fees?tokenMint=${mint}`, {
            timeout: 8000
        });

        if (!res.ok) throw new Error(`Fee Endpoint Error: ${res.status}`);

        const data = await res.json();

        if (data.success && data.response) {
            const lamports = Number(data.response);
            const sol = lamports / 1000000000;

            console.log(`[BagsService] 2. Raw Fees Found: ${sol} SOL. Fetching Price...`);

            // 2. Fetch Exact Price (Bags Source) for Parity
            let solPrice = 0;
            try {
                const priceRes = await fetch('https://api2.bags.fm/api/v1/solana/latestPrice?token=So11111111111111111111111111111111111111112', { timeout: 3000 });
                const priceData = await priceRes.json();
                if (priceData && priceData.info && priceData.info.price) {
                    solPrice = Number(priceData.info.price);
                    console.log(`[BagsService] Price (API2): $${solPrice}`);
                }
            } catch (e) {
                console.warn("[BagsService] Price API2 failed, trying fallback...");
            }

            // Fallback price
            if (!solPrice) {
                const mkt = await marketService.fetchTokenData('So11111111111111111111111111111111111111112');
                solPrice = mkt?.price || 180;
                console.log(`[BagsService] Price (Market/Default): $${solPrice}`);
            }

            const totalUSD = sol * solPrice;
            console.log(`[BagsService] FINAL CALC: $${totalUSD.toFixed(2)}`);

            return {
                totalFees: totalUSD,
                claimable: 0,
                currency: 'USD',
                rawSol: sol,
                solPrice
            };
        }

        throw new Error("Invalid API2 JSON structure");
    } catch (e) {
        console.error("___________________________________________________");
        console.error("[BagsService] CRITICAL FAILURE IN FEES FETCH");
        console.error("ERROR:", e.message);
        console.error("FALLING BACK TO 1% VOLUME ESTIMATE");
        console.error("___________________________________________________");

        // Fallback to estimation
        const stats = await getTokenStats(mint);
        if (stats && stats.volume24h) {
            return {
                totalFees: stats.volume24h * 0.01,
                claimable: 0,
                isEstimate: true
            };
        }
        return { totalFees: 0, claimable: 0 };
    }
}


export async function getTopHolders(mint) {
    try {
        const lb = await getLeaderboard();
        return {
            holders: lb.topHolders || [],
            updatedAt: lb.updatedAt,
            source: 'snapshot',
            meta: {
                count: lb.topHolders?.length || 0
            }
        };
    } catch (e) {
        console.error("[BagsService] getTopHolders failed:", e);
        return { holders: [], error: e.message };
    }
}
