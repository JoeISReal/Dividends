// src/state/gameStore.js
// Unified game state management with Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateIncome } from '../game/incomeEngineFixed';
import { resilientFetch } from '../api/http';
import { STREAMS } from '../data/GameData';
import { directiveEngine } from '../game/directiveEngine';

const API_BASE = import.meta.env.VITE_API_URL || '';


export const useGameStore = create(
    persist(
        (set, get) => ({

            /* ========================
               CORE ECONOMY
            ======================== */
            balance: 100,
            yps: 0,
            yieldPerClick: 1,
            totalClicks: 0,
            lifetimeYield: 0,

            /* ========================
               AUTH & LEADERBOARD
            ======================== */
            auth: {
                user: null, // { handle: string }
                isAuthenticated: false
            },
            leaderboard: [],
            leaderboardLoading: false,
            bagsStatusError: false, // New state for bags status errors
            isStale: false, // New state for stale data from bags status
            tokenLeaderboard: [], // NEW: Token Holders List
            tokenLeaderboardLoading: false,

            marketStats: {
                mood: 'QUIET',
                volume24h: 0,
                feesTrend: 'FLAT',
                activeWalletsTrend: 'FLAT',
                tags: [], // Added
                analytics: {}, // Added
                stale: false // Added
            },

            /* ========================
               STREAMS
            ======================== */
            streams: Object.fromEntries(STREAMS.map(s => [s.id, {
                level: 0,
                baseCost: s.baseCost,
                baseYps: s.baseYield,
                category: s.category, // Needed for UI grouping
                hasManager: false
            }])),

            // Phase B: Decay Tracking
            streamAges: {}, // { id: { ageSec: 0, lastTick: ts } }
            fatigue: 0,
            lastFatigueUpdate: Date.now(),

            /* ========================
               MULTIPLIERS
            ======================== */
            multipliers: {
                prestige: 1,      // From prestige resets
                global: 1,        // From R&D upgrades
                click: 1,         // From click upgrades
            },

            /* ========================
               MANAGERS
            ======================== */
            managers: Object.fromEntries(STREAMS.map(s => [s.id, false])),

            // Dynamic lookup, no longer hardcoded state
            managerCosts: Object.fromEntries(STREAMS.map(s => [s.id, s.baseCost * 100])), // Rule of thumb: Manager = 100x Base? Or logic?
            // Wait, backend relies on `STREAMS` or static map. 
            // In gameStore `managerCosts` was specific. 
            // Let's approximate or use a Fixed Map if we want to match legacy prices EXACTLY.
            // But since IDs changed, legacy prices don't map 1:1.
            // Let's use 100x Base Cost as a safe default for now, or 500x.
            // Previous: shitpost (10) -> 15000 (1500x). engagement (100) -> 100000 (1000x).
            // Let's use 1000x Base Cost for managers.

            /* ========================
               UPGRADES
            ======================== */
            upgrades: {
                clickLevel: 0,
                globalLevel: 0,
            },

            /* ========================
               ARENA STATE
            ======================== */
            arena: {
                lastEntry: null,
                lastExit: null,
                lastPnL: 0,
                totalPnL: 0,
                stability: 100,
                maxStability: 100,
                lastStabilityUpdatePrice: 1.0,
            },

            tradeHistory: [],

            /* ========================
               NOTIFICATIONS
            ======================== */
            notification: null, // { message, type, id }

            showNotification: (message, type = 'info') => {
                set({
                    notification: {
                        message,
                        type,
                        id: Date.now()
                    }
                });
            },

            /* ========================
               SYSTEM FEED SIGNALS
            ======================== */
            signals: [], // { id, type, message, timestamp }

            runDirectives: () => {
                const state = get();
                const newSignals = directiveEngine.check(state);
                if (!newSignals.length) return;

                // Deduplicate: exact match on message + type
                // We want to keep the NEW signal and remove the OLD one.
                const newMessages = new Set(newSignals.map(s => `${s.type}:${s.message}`));

                const filteredOld = (state.signals || []).filter(s =>
                    !newMessages.has(`${s.type}:${s.message}`)
                );

                // Add new signals to the FRONT (Newest First) to match emitSignal behavior
                const combined = [...newSignals.reverse(), ...filteredOld].slice(0, 10);

                set({ signals: combined });
            },

            emitSignal: (arg1, arg2) => {
                set(state => {
                    let newSignal;

                    // Handle legacy signature: emitSignal(type, message)
                    if (typeof arg1 === 'string') {
                        newSignal = {
                            id: Date.now() + Math.random(),
                            type: arg1,
                            message: arg2,
                            timestamp: Date.now()
                        };
                    }
                    // Handle new object signature: emitSignal({ type, message, domain, severity })
                    else if (typeof arg1 === 'object') {
                        newSignal = {
                            id: Date.now() + Math.random(),
                            timestamp: Date.now(),
                            ...arg1
                        };
                    }

                    // Safety fallback
                    if (!newSignal || !newSignal.message) {
                        console.warn("Invalid signal emitted", arg1, arg2);
                        return {};
                    }

                    // Deduplication: If identical message exists, remove it + re-add at top (bump timestamp)
                    const existingIndex = state.signals.findIndex(s =>
                        s.message === newSignal.message && s.type === newSignal.type
                    );

                    let newSignals = [...state.signals];
                    if (existingIndex !== -1) {
                        newSignals.splice(existingIndex, 1);
                    }

                    // Keep last 10 signals
                    return { signals: [newSignal, ...newSignals].slice(0, 10) };
                });
            },

            clearNotification: () => set({ notification: null }),

            /* ========================
               STATS
            ======================== */
            stats: {
                totalStreamsPurchased: 0,
                totalUpgradesBought: 0,
                totalPrestigeCount: 0,
                totalArenaTradesWon: 0,
                totalArenaTradesLost: 0,
            },

            /* ========================
               CORE ACTIONS
            ======================== */

            addBalance: (amt) => {
                const state = get();
                set({
                    balance: state.balance + amt,
                    lifetimeYield: state.lifetimeYield + Math.max(0, amt),
                });
            },

            spend: (amt) => {
                const state = get();
                if (state.balance < amt) return false;
                set({ balance: state.balance - amt });
                return true;
            },

            registerClick: () => {
                const state = get();
                const clickValue = state.yieldPerClick * state.multipliers.click;
                set({
                    balance: state.balance + clickValue,
                    totalClicks: state.totalClicks + 1,
                    lifetimeYield: state.lifetimeYield + clickValue,
                });
            },

            /* ========================
               STREAM MANAGEMENT
            ======================== */

            buyStream: (streamKey, quantity = 1) => {
                const state = get();
                const stream = state.streams[streamKey];
                if (!stream) return false;

                let totalCost = 0;
                for (let i = 0; i < quantity; i++) {
                    const cost = Math.floor(stream.baseCost * Math.pow(1.15, stream.level + i));
                    totalCost += cost;
                }

                if (state.balance < totalCost) return false;

                // Update stream level
                stream.level += quantity;

                // Recalculate YPS
                // Create a temporary state projection for calculation
                const tempState = { ...state, streams: { ...state.streams } };
                const realYps = calculateIncome(tempState, 1);

                set({
                    balance: state.balance - totalCost,
                    streams: { ...state.streams },
                    yps: realYps,
                    stats: {
                        ...state.stats,
                        totalStreamsPurchased: state.stats.totalStreamsPurchased + quantity,
                    },
                });

                // Sync
                fetch(`${API_BASE}/api/buy-stream`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        streamId: streamKey,
                        amount: quantity
                    })
                }).catch(e => console.error("Buy stream sync fail", e));

                state.emitSignal({
                    type: 'info',
                    domain: 'economy',
                    severity: 1,
                    message: `Infrastructure acquired: ${streamKey.toUpperCase()} x${quantity}`
                });

                get().runDirectives();

                return true;
            },


            /* ========================
               MANAGER SYSTEM
            ======================== */

            hireManager: (streamKey) => {
                const state = get();
                const cost = state.managerCosts[streamKey];

                if (!cost || state.managers[streamKey]) return false;
                if (state.balance < cost) return false;

                const newState = {
                    ...state,
                    balance: state.balance - cost,
                    managers: {
                        ...state.managers,
                        [streamKey]: true,
                    },
                    streams: {
                        ...state.streams,
                        [streamKey]: {
                            ...state.streams[streamKey],
                            hasManager: true // Ensure stream knows it has manager
                        }
                    }
                };

                // Recalculate YPS now that manager is hired
                const newYps = calculateIncome(newState, 1);

                set({
                    ...newState,
                    yps: newYps
                });

                // Sync
                fetch(`${API_BASE}/api/hire-manager`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ streamId: streamKey })
                }).catch(e => console.error("Hire manager sync fail", e));

                state.emitSignal({
                    type: 'success',
                    domain: 'economy',
                    severity: 1,
                    message: `Operator assigned: ${streamKey.toUpperCase()} MANAGER`
                });

                get().runDirectives();

                return true;
            },


            /* ========================
               UPGRADE SYSTEM
            ======================== */

            buyUpgrade: (upgradeType) => {
                const state = get();

                if (upgradeType === 'click') {
                    const cost = Math.floor(500 * Math.pow(2, state.upgrades.clickLevel));
                    if (state.balance < cost) return false;

                    set({
                        balance: state.balance - cost,
                        multipliers: {
                            ...state.multipliers,
                            click: state.multipliers.click * 2,
                        },
                        upgrades: {
                            ...state.upgrades,
                            clickLevel: state.upgrades.clickLevel + 1,
                        },
                        stats: {
                            ...state.stats,
                            totalUpgradesBought: state.stats.totalUpgradesBought + 1,
                        },
                    });

                    // Sync
                    fetch(`${API_BASE}/api/buy-upgrade`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ key: 'click' })
                    }).catch(e => console.error("Buy upgrade sync fail", e));

                    return true;
                }

                if (upgradeType === 'global') {
                    const cost = Math.floor(50000 * Math.pow(1.5, state.upgrades.globalLevel));
                    if (state.balance < cost) return false;

                    const newGlobalMult = state.multipliers.global * 1.1;

                    const nextState = {
                        ...state,
                        balance: state.balance - cost,
                        multipliers: {
                            ...state.multipliers,
                            global: newGlobalMult,
                        },
                        upgrades: {
                            ...state.upgrades,
                            globalLevel: state.upgrades.globalLevel + 1,
                        },
                        stats: {
                            ...state.stats,
                            totalUpgradesBought: state.stats.totalUpgradesBought + 1,
                        },
                    };

                    const realYps = calculateIncome(nextState, 1);

                    set({
                        ...nextState,
                        yps: realYps
                    });

                    // Sync
                    fetch(`${API_BASE}/api/buy-upgrade`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ key: 'global' })
                    }).catch(e => console.error("Buy upgrade sync fail", e));

                    return true;
                }


                return false;
            },

            /* ========================
               PRESTIGE SYSTEM
            ======================== */

            doPrestige: async () => {
                const state = get();

                try {
                    // 1. AUTHORITATIVE ACTION: Call Backend First
                    const res = await fetch(`${API_BASE}/api/prestige`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({})
                    });

                    if (!res.ok) throw new Error('Network response was not ok');

                    const data = await res.json();

                    if (!data.success) {
                        state.showNotification(data.reason || "Prestige failed", "warning");
                        return;
                    }

                    const player = data.player;

                    // 2. STATE SYNC
                    // We trust the backend's multiplier and balance. We reset local assets to match.
                    set({
                        // Reset economy from backend
                        balance: player.balance, // Should be 0
                        yps: 0,

                        // Reset streams (Hydrate structure with Level 0)
                        streams: Object.fromEntries(
                            Object.entries(state.streams).map(([key, stream]) => [
                                key,
                                { ...stream, level: 0 },
                            ])
                        ),

                        // Reset managers
                        managers: Object.fromEntries(STREAMS.map(s => [s.id, false])),

                        // Update Multipliers from Backend Authority
                        multipliers: {
                            prestige: player.prestige.multiplier,
                            global: 1, // Reset R&D
                            click: 1,
                        },

                        // Reset upgrades (Sync with backend schema)
                        upgrades: player.upgrades, // { clickLevel: 0, globalLevel: 0 }

                        // Update stats
                        stats: {
                            ...state.stats,
                            totalPrestigeCount: state.stats.totalPrestigeCount + 1,
                        },
                    });

                    state.emitSignal({
                        type: 'success',
                        domain: 'economy',
                        severity: 1,
                        message: `PRESTIGE PERFORMED! New Multiplier: x${player.prestige.multiplier.toFixed(2)}`
                    });

                    return player.prestige.multiplier; // Return for UI feedback

                } catch (e) {
                    console.error("Prestige sync fail", e);
                    state.showNotification("Prestige synchronization failed. Please check connection.", "danger");
                }
            },

            /* ========================
               DEGEN ARENA INTEGRATION
            ======================== */

            applyArenaResult: (pnl, details = {}) => {
                const state = get();
                const isWin = pnl > 0;

                const newTrade = {
                    timestamp: Date.now(),
                    pnl: pnl,
                    betAmount: details.betAmount || 0,
                    entryPrice: details.entryPrice || 0,
                    exitPrice: details.exitPrice || 0,
                    multiplier: details.multiplier || 1,
                    isWin: isWin
                };

                set({
                    balance: state.balance + pnl,
                    arena: {
                        lastEntry: state.arena.lastEntry,
                        lastExit: Date.now(),
                        lastPnL: pnl,
                        totalPnL: state.arena.totalPnL + pnl,
                        // Ensure stability is preserved or updated elsewhere
                        stability: state.arena.stability,
                        maxStability: state.arena.maxStability,
                        lastStabilityUpdatePrice: state.arena.lastStabilityUpdatePrice
                    },
                    stats: {
                        ...state.stats,
                        totalArenaTradesWon: state.stats.totalArenaTradesWon + (isWin ? 1 : 0),
                        totalArenaTradesLost: state.stats.totalArenaTradesLost + (isWin ? 0 : 1),
                    },
                    tradeHistory: [...state.tradeHistory, newTrade],
                });

                // Signal Feed
                state.emitSignal({
                    type: isWin ? 'success' : 'warning',
                    domain: 'arena',
                    severity: 2,
                    message: isWin ? `Position closed: +$${pnl.toLocaleString()}` : `Position liquidated: -$${Math.abs(pnl).toLocaleString()}`
                });

                get().runDirectives();
            },

            setArenaEntry: (amount, currentPrice = 1.0) => {
                const state = get();
                const now = Date.now();

                // Fatigue-based Cooldown
                // Base 2s + (Fatigue * 50ms). Max ~7s.
                // TUNED: Faster pacing (was 5s / 100ms)
                const cooldownMs = 2000 + (state.fatigue * 50);
                const lastExit = state.arena.lastExit || 0;

                if (now - lastExit < cooldownMs) {
                    const remaining = Math.ceil((cooldownMs - (now - lastExit)) / 1000);
                    state.showNotification(`Arena recovering... ${remaining}s`, 'error');
                    return false;
                }

                set({
                    arena: {
                        ...state.arena,
                        lastEntry: amount,
                        stability: 100,
                        maxStability: 100,
                        lastStabilityUpdatePrice: currentPrice,
                    },
                });
                return true;
            },

            updateArenaStability: (currentPrice) => {
                const state = get();
                const { stability, maxStability, lastStabilityUpdatePrice } = state.arena;

                if (stability <= 0) return 'busted';

                let newStability = stability;
                const lastPrice = lastStabilityUpdatePrice || 1.0;
                const diff = (currentPrice - lastPrice) / lastPrice;

                // Rug damage
                if (diff <= -0.025) {
                    // Large rug
                    newStability -= 25 + Math.floor(Math.random() * 15); // 25-40 damage
                    state.emitSignal({
                        type: 'danger',
                        domain: 'arena',
                        severity: 3,
                        message: 'Rug pull detected: Stability critical'
                    });
                } else if (diff <= -0.01) {
                    // Small dip
                    newStability -= 10;
                    state.emitSignal({
                        type: 'warning',
                        domain: 'arena',
                        severity: 2,
                        message: 'Volatility spike: Stability degraded'
                    });
                }

                // Pump recovery bonus
                if (diff >= 0.02) {
                    newStability += 8;
                    state.emitSignal({
                        type: 'success',
                        domain: 'arena',
                        severity: 1,
                        message: 'Buying pressure detected: Stability recovering'
                    });
                }

                // Optional: Slow regeneration (low volatility)
                if (Math.abs(diff) < 0.005) {
                    newStability += 2;
                }

                // Clamp values
                if (newStability > maxStability) newStability = maxStability;
                if (newStability < 0) newStability = 0;

                // Update state
                set({
                    arena: {
                        ...state.arena,
                        stability: newStability,
                        lastStabilityUpdatePrice: currentPrice,
                    }
                });

                if (newStability <= 0) {
                    state.emitSignal({
                        type: 'danger',
                        domain: 'arena',
                        severity: 3,
                        message: 'SYSTEM FAILURE: Arena Collapsed'
                    });
                    return 'busted';
                }

                get().runDirectives();
                return 'ok';
            },

            /* ========================
               UTILITY
            ======================== */

            setYPS: (val) => set({ yps: val }),

            incrementStat: (key, val = 1) => {
                const state = get();
                set({
                    stats: {
                        ...state.stats,
                        [key]: (state.stats[key] || 0) + val
                    }
                });
            },


            resetGame: () => {
                set({
                    balance: 100,
                    yps: 0,
                    yieldPerClick: 1,
                    totalClicks: 0,
                    lifetimeYield: 0,

                    // Reset XP? Maybe keep it? strict reset for now
                    xp: 0,
                    level: 1,
                    xpToNext: 1000,

                    // Reset Streams via Map
                    streams: Object.fromEntries(STREAMS.map(s => [s.id, {
                        level: 0,
                        baseCost: s.baseCost,
                        baseYps: s.baseYield,
                        category: s.category,
                        hasManager: false
                    }])),

                    // Reset Managers
                    managers: Object.fromEntries(STREAMS.map(s => [s.id, false])),

                    streamAges: {},
                    fatigue: 0,
                    upgrades: {
                        clickLevel: 0,
                        globalLevel: 0,
                    },
                    socials: {
                        twitter: false,
                        discord: false
                    },
                    arena: {
                        lastEntry: null,
                        lastExit: null,
                        lastPnL: 0,
                        totalPnL: 0,
                        stability: 100,
                        maxStability: 100,
                        lastStabilityUpdatePrice: 1.0,
                    },
                    stats: {
                        totalStreamsPurchased: 0,
                        totalUpgradesBought: 0,
                        totalPrestigeCount: 0,
                        totalArenaTradesWon: 0,
                        totalArenaTradesLost: 0,
                    },
                    bagsStatusError: false, // Reset bags status error
                    isStale: false, // Reset stale status
                });
            },

            /* ========================
               SOCIALS
            ======================== */
            socials: {
                twitter: false,
                discord: false
            },

            claimSocialReward: (platform) => {
                const state = get();
                if (state.socials[platform]) return false; // Already claimed

                // Reward amounts
                const rewards = {
                    twitter: 1000000, // $1M
                    discord: 1000000  // $1M
                };

                const reward = rewards[platform] || 0;
                if (reward === 0) return false;

                set({
                    balance: state.balance + reward,
                    socials: {
                        ...state.socials,
                        [platform]: true
                    }
                });
                return reward;
            },

            /* ========================
               XP SYSTEM
            ======================== */
            xp: 0,
            level: 1,
            xpToNext: 1000,

            awardXP: (amount) => {
                const state = get();
                // Pass fatigue to addXP logic (logic should be in XPSystem or here)
                // Since xpSystem is just a helper/class, we logic here or import it?
                // The prompt request was to "Update XP progression logic".
                // I updated `xpSystem.js` to have `addXP(amount, roundXP, fatigue)`. 
                // Implemenation of `awardXP` should use `XPSystem` class if possible or inline logic.
                // Previous `awardXP` was inline. I will switch to using the logic I wrote in xpSystem.js if imported, 
                // but `gameStore.js` doesn't import `XPSystem` class currently.
                // To save time/risk, I will inline the Verified Logic from xpSystem.js here.

                // 1. Fatigue Penalty
                const fatigue = state.fatigue || 0;
                const efficiency = Math.max(0.2, 1.0 - (fatigue * 0.008));
                const effectiveAmount = Math.floor(amount * efficiency);

                if (effectiveAmount <= 0) return;

                const currentXP = state.xp + effectiveAmount;

                // 2. Level Logic (Logarithmic)
                // Cost(L) = 1000 * log2(L+2)^1.4
                // We re-calculate level from scratch based on Total XP to be safe/consistent?
                // Backend: `getLevelFromXP`.
                // Let's copy the backend logic "XP is Cumulative/Total".
                // But wait, `getLevelFromXP` loop subtracted cost: `currentXP -= cost`.
                // That implies XP is consumed.
                // If I keep `state.xp` as Cumulative, I need a different getLevel formula.
                // Let's stick to "XP Resets on Level Up" model for simplicity in this loop as implied by backend loop.
                // Logic:
                let newXP = currentXP;
                let newLevel = state.level;

                while (true) {
                    const cost = Math.floor(1000 * Math.pow(Math.log2(newLevel + 2), 1.4));
                    if (newXP >= cost) {
                        newXP -= cost;
                        newLevel++;
                    } else {
                        break;
                    }
                    if (newLevel > 1000) break;
                }

                const nextCost = Math.floor(1000 * Math.pow(Math.log2(newLevel + 2), 1.4));
                const xpToNext = nextCost - newXP;

                set({
                    xp: newXP,
                    level: newLevel,
                    xpToNext: xpToNext
                });
            },

            // Phase B: Game Loop Logic
            processFatigue: (dt) => {
                const state = get();
                let { fatigue, arena, streamAges } = state;
                let newFatigue = fatigue;

                // 1. Fatigue Growth/Recovery
                // Grow if stability < 50
                if (arena.stability < 50) {
                    const growth = (50 - arena.stability) / 20; // e.g. Stab 0 -> +2.5/sec
                    newFatigue += (growth * dt);
                } else {
                    // Recover
                    // TUNED: 10x faster recovery (was 0.5)
                    newFatigue -= (5.0 * dt);
                }
                newFatigue = Math.max(0, Math.min(100, newFatigue));

                // Manual fatigue signals removed in favor of Directive Engine

                // 2. Update Stream Ages (For Decay)
                // Traverse STREAMS to find decay ones?
                // Or just iterate existing streamAges keys?
                // Better: Iterate owned streams that are 'decay' type.
                // We need STREAMS metadata.
                const newStreamAges = { ...streamAges };

                // We rely on imported STREAMS from top of file
                // Optimization: Pre-filter decay streams?
                STREAMS.forEach(s => {
                    if (s.category === 'decay') {
                        if (state.streams[s.id] && (state.streams[s.id].level > 0)) {
                            if (!newStreamAges[s.id]) newStreamAges[s.id] = { ageSec: 0, lastTick: Date.now() };

                            const info = newStreamAges[s.id];
                            newStreamAges[s.id] = {
                                ageSec: info.ageSec + dt,
                                lastTick: Date.now()
                            };
                        }
                    }
                });

                set({
                    fatigue: newFatigue,
                    streamAges: newStreamAges,
                    lastFatigueUpdate: Date.now()
                });

                // Engage Directive Engine (Heartbeat)
                // We use a random chance or throttle to avoid spamming checking every 100ms if performance is a concern,
                // but checking is cheap. Let's run it.
                get().runDirectives();
            },

            /* ========================
               LEADERBOARD ACTIONS
            ======================== */
            updateDisplayName: async (newName) => {
                const state = get();
                if (!state.auth.isAuthenticated) return { success: false, error: "Not logged in" };

                try {
                    const res = await fetch(`${API_BASE}/api/profile/update`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ newDisplayName: newName }) // No handle needed
                    });

                    // Check content type to avoid JSON parse errors on 404 HTML pages
                    const contentType = res.headers.get("content-type");
                    let data;
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        data = await res.json();
                    } else {
                        // Likely a 404 server error page or similar
                        const text = await res.text();
                        console.error("Non-JSON response from server:", text.substring(0, 500));
                        return { success: false, error: `Server Error(${res.status}): Endpoint likely not found` };
                    }

                    if (res.ok) {
                        // Update local state
                        set({
                            auth: {
                                ...state.auth,
                                user: {
                                    ...state.auth.user,
                                    displayName: data.displayName
                                }
                            }
                        });
                        return { success: true };
                    } else {
                        return { success: false, error: data.error || "Unknown server error" };
                    }
                } catch (e) {
                    console.error("Update Name Exception:", e);
                    return { success: false, error: `Connection failed: ${e.message} ` };
                }
            },

            // Phase 4: Resilient Fetch
            fetchBagsStatus: async () => {
                const s = get();
                if (!s.auth.isAuthenticated) return;

                set({ leaderboardLoading: true });
                try {
                    // 1. Holder Status
                    const res = await resilientFetch('/api/bags/status');
                    const data = await res.json();

                    set(state => ({
                        auth: {
                            ...state.auth,
                            user: {
                                ...state.auth.user,
                                holderTier: data.tier,
                                holderBalanceApprox: data.balanceApprox
                            }
                        },
                        // Store Stale State for UI
                        bagsStatusError: false,
                        isStale: !!data.stale
                    }));

                    // 2. Market Mood
                    const marketRes = await resilientFetch('/api/ecosystem/mood');
                    const marketData = await marketRes.json();
                    set({
                        marketStats: {
                            mood: marketData.mood || 'QUIET',
                            volume24h: marketData.volume24h || 0,
                            tags: marketData.tags || [],
                            analytics: marketData.analytics || {},
                            feesTrend: 'FLAT',
                            activeWalletsTrend: 'FLAT',
                            stale: !!marketData.stale // Ecosystem can be stale too
                        }
                    });

                } catch (e) {
                    console.error("Bags fetch failed after retries:", e);
                    if (e.status === 401) {
                        // Session dead, force logout
                        get().logout();
                    } else {
                        set({ bagsStatusError: true }); // UI can show "Connection Lost"
                    }
                } finally {
                    set({ leaderboardLoading: false });
                }
            },

            hydrateAndLogin: (user) => {
                const u = user;

                // 1. CLEAR OLD STATE
                get().resetGame();

                // 2. Hydrate Basic Stats
                const patch = {
                    auth: { user: u, isAuthenticated: true },
                    balance: u.balance || 0,
                    lifetimeYield: u.lifetimeYield || 0,
                    level: u.level || 1,
                    xp: u.xp || 0,
                    fatigue: u.fatigue || 0,
                    streamAges: u.streamAges || {},
                };

                // 3. Hydrate Managers (Merge with Defaults)
                const defaultManagers = Object.fromEntries(STREAMS.map(s => [s.id, false]));
                const backendManagers = u.managers || {};
                const hydratedManagers = { ...defaultManagers, ...backendManagers };

                // 4. Hydrate Streams
                const currentStreams = get().streams;
                const newStreams = { ...currentStreams };

                if (u.streams) {
                    Object.entries(u.streams).forEach(([key, lvl]) => {
                        if (newStreams[key]) {
                            newStreams[key] = {
                                ...newStreams[key],
                                level: lvl,
                                hasManager: !!hydratedManagers[key]
                            };
                        }
                    });
                }

                Object.keys(hydratedManagers).forEach(mgrKey => {
                    if (hydratedManagers[mgrKey] && newStreams[mgrKey]) {
                        newStreams[mgrKey] = {
                            ...newStreams[mgrKey],
                            hasManager: true
                        };
                    }
                });

                // 5. Hydrate Upgrades
                const hydratedUpgrades = {
                    clickLevel: 0,
                    globalLevel: 0,
                    ...(u.upgrades || {})
                };

                const newClickMult = 1 * Math.pow(2, hydratedUpgrades.clickLevel);
                const newGlobalMult = 1 * Math.pow(1.10, hydratedUpgrades.globalLevel);
                const prestigeMult = u.multipliers?.prestige || 1;

                const hydratedMultipliers = {
                    click: newClickMult,
                    global: newGlobalMult,
                    prestige: prestigeMult
                };

                patch.streams = newStreams;
                patch.managers = hydratedManagers;
                patch.upgrades = hydratedUpgrades;
                patch.multipliers = hydratedMultipliers;

                // 6. Recalculate YPS
                const tempState = { ...get(), ...patch };
                patch.yps = calculateIncome(tempState, 1);

                // 7. Apply State
                set(patch);
                return { success: true };
            },

            login: async (walletAddress, message, signature) => {
                try {
                    // VERIFY PHASE
                    const res = await fetch(`${API_BASE}/api/auth/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ wallet: walletAddress, message, signature })
                    });

                    if (!res.ok) {
                        const errText = await res.text();
                        try {
                            const json = JSON.parse(errText);
                            return { success: false, error: json.error || "Login Failed" };
                        } catch {
                            return { success: false, error: `Server error: ${res.status} ${res.statusText} ` };
                        }
                    }

                    const data = await res.json();
                    if (data.ok && data.user) {
                        return get().hydrateAndLogin(data.user);
                    }
                    return { success: false, error: data.error || "Unknown server error" };
                } catch (e) {
                    console.error("Login failed (Is backend running?)", e);
                    return { success: false, error: `Connection failed: ${e.message} ` };
                }
            },

            logout: async () => {
                try {
                    await fetch(`${API_BASE}/api/auth/logout`, {
                        method: 'POST',
                        credentials: 'include'
                    });
                } catch (e) {
                    console.error("Logout fetch failed", e);
                }
                set({
                    auth: { user: null, isAuthenticated: false }
                });
            },

            syncScore: async () => {
                const state = get();
                if (!state.auth.isAuthenticated) return;

                try {
                    // Unified call: Send Score -> Get Leaderboard
                    const res = await fetch(`${API_BASE}/api/sync`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            // Handle is in session cookie, do not send
                            balance: state.balance,
                            lifetimeYield: state.lifetimeYield,
                            level: state.level
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        // Update leaderboard immediately from response
                        if (data.leaderboard) {
                            set({ leaderboard: data.leaderboard });
                        }
                    } else if (res.status === 401) {
                        // Session expired
                        set({ auth: { user: null, isAuthenticated: false } });
                    }
                } catch (e) {
                    console.error("Score sync failed", e);
                }
            },

            // FETCH TOKEN LEADERBOARD (Top 100 Holders from Chain)
            fetchTokenLeaderboard: async () => {
                set({ tokenLeaderboardLoading: true });
                try {
                    const res = await fetch(`${API_BASE}/api/bags/token/top-holders`);
                    const data = await res.json();
                    set({ tokenLeaderboard: Array.isArray(data) ? data : [], tokenLeaderboardLoading: false });
                } catch (e) {
                    console.error("Token Leaderboard fetch failed", e);
                    set({ tokenLeaderboard: [], tokenLeaderboardLoading: false });
                }
            },

            fetchLeaderboard: async () => {
                const state = get();
                set({ leaderboardLoading: true });
                try {
                    // Even for fetching, we can "ping" with current stats if auth,
                    // by calling sync. If not auth, maybe we need a public leaderboard route?
                    // For now, let's just assume public leaderboard reads are via sync or we add a read-only endpoint.
                    // The sync endpoint returns leaderboard.
                    // We can reuse the sync logic if authenticated.
                    if (state.auth.isAuthenticated) {
                        await get().syncScore();
                    } else {
                        // Fallback to public sync if possible or add public route?
                        // Since sync is protected now, unauthenticated users can't fetch leaderboard via sync.
                        // We should probably add a public GET /api/leaderboard.
                        // For Phase 1 constraints, let's just skip fetching if not logged in or try a read-only call if one existed.
                        // Actually, let's try to call sync with empty body? No, requireAuth blocks it.
                        // We need a public leaderboard endpoint if we want guests to see it.
                        // BUT Phase 1 says "All game writes require auth". It doesn't forbid public reads.
                        // We'll leave it as is for now - guests might not see leaderboard.
                    }
                } catch (e) {
                    console.error("Leaderboard fetch failed", e);
                }
                set({ leaderboardLoading: false });
            },

        }),
        {
            name: 'dividends-game-state',
            version: 2, // Increment version to trigger migration
            migrate: (persistedState, version) => {
                if (version < 2) {
                    // Sanitize NaN values from previous version bugs
                    const state = persistedState;
                    if (Number.isNaN(state.balance)) state.balance = 0;
                    if (Number.isNaN(state.yps)) state.yps = 0;
                    if (Number.isNaN(state.lifetimeYield)) state.lifetimeYield = 0;

                    // Sanitize streams
                    if (state.streams) {
                        Object.values(state.streams).forEach(s => {
                            if (Number.isNaN(s.level)) s.level = 0;
                        });
                    }
                    return state;
                }
                return persistedState;
            },
        }
    )
);
