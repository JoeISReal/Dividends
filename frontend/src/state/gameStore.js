// src/state/gameStore.js
// Unified game state management with Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateIncome } from '../game/incomeEngineFixed';
import { getPerksForLevel } from '../game/perksRegistry';
import { resilientFetch } from '../api/http';

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
            streams: {
                shitpost: { level: 0, baseCost: 10, baseYps: 1 },
                engagement: { level: 0, baseCost: 100, baseYps: 5 },
                pump: { level: 0, baseCost: 1100, baseYps: 15 },
                nft: { level: 0, baseCost: 12000, baseYps: 35 },
                algo: { level: 0, baseCost: 130000, baseYps: 75 },
                sentiment: { level: 0, baseCost: 1400000, baseYps: 150 },
            },

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
            managers: {
                shitpost: false,
                engagement: false,
                pump: false,
                nft: false,
                algo: false,
                sentiment: false,
            },

            managerCosts: {
                shitpost: 15000,
                engagement: 100000,
                pump: 500000,
                nft: 1000000,
                algo: 5000000,
                sentiment: 10000000,
            },

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

                // Server Sync (Protected)
                fetch(`${API_BASE}/api/buy-stream`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        streamId: streamKey,
                        amount: quantity
                    })
                }).catch(e => console.error("Buy stream sync fail", e));

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
                        body: JSON.stringify({ key: 'click_upgrade' }) // Mapping needed? Or just generic
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
                        body: JSON.stringify({ key: 'global_upgrade' })
                    }).catch(e => console.error("Buy upgrade sync fail", e));

                    return true;
                }


                return false;
            },

            /* ========================
               PRESTIGE SYSTEM
            ======================== */

            doPrestige: () => {
                const state = get();

                // Calculate prestige bonus based on current YPS
                const bonus = Math.floor(state.yps / 50) + 1;
                const newPrestigeMult = state.multipliers.prestige + bonus;

                set({
                    // Reset economy
                    balance: 0,
                    yps: 0,

                    // Reset streams
                    streams: Object.fromEntries(
                        Object.entries(state.streams).map(([key, stream]) => [
                            key,
                            { ...stream, level: 0 },
                        ])
                    ),

                    // Reset managers
                    managers: {
                        shitpost: false,
                        engagement: false,
                        pump: false,
                        nft: false,
                        algo: false,
                        sentiment: false,
                    },

                    // Keep prestige multiplier, reset others
                    multipliers: {
                        prestige: newPrestigeMult,
                        global: 1,
                        click: 1,
                    },

                    // Reset upgrades
                    upgrades: {
                        clickLevel: 0,
                        globalLevel: 0,
                    },

                    // Update stats
                    stats: {
                        ...state.stats,
                        totalPrestigeCount: state.stats.totalPrestigeCount + 1,
                    },
                });

                // Sync
                fetch(`${API_BASE}/api/prestige`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({})
                }).catch(e => console.error("Prestige sync fail", e));

                return bonus;
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
            },

            setArenaEntry: (amount, currentPrice = 1.0) => {
                set({
                    arena: {
                        ...get().arena,
                        lastEntry: amount,
                        stability: 100,
                        maxStability: 100,
                        lastStabilityUpdatePrice: currentPrice,
                    },
                });
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
                } else if (diff <= -0.01) {
                    // Small dip
                    newStability -= 10;
                }

                // Pump recovery bonus
                if (diff >= 0.02) {
                    newStability += 8;
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

                if (newStability <= 0) return 'busted';
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

                    streams: {
                        shitpost: { level: 0, baseCost: 10, baseYps: 1 },
                        engagement: { level: 0, baseCost: 100, baseYps: 5 },
                        pump: { level: 0, baseCost: 1100, baseYps: 15 },
                        nft: { level: 0, baseCost: 12000, baseYps: 35 },
                        algo: { level: 0, baseCost: 130000, baseYps: 75 },
                        sentiment: { level: 0, baseCost: 1400000, baseYps: 150 },
                    },
                    multipliers: {
                        prestige: 1,
                        global: 1,
                        click: 1,
                    },
                    managers: {
                        shitpost: false,
                        engagement: false,
                        pump: false,
                        nft: false,
                        algo: false,
                        sentiment: false,
                    },
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
                const currentXP = state.xp + amount;

                // Simple Leveling: 1000 XP per level flat for now, or use formula
                // Level = 1 + floor(XP / 1000)
                const newLevel = 1 + Math.floor(currentXP / 1000);
                const nextLevelXP = newLevel * 1000;
                const dist = nextLevelXP - currentXP;

                set({
                    xp: currentXP,
                    level: newLevel,
                    xpToNext: dist
                });
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
                        const u = data.user;

                        // 1. CLEAR OLD STATE (Essential for wallet switching)
                        get().resetGame();

                        // 2. Hydrate Basic Stats
                        const patch = {
                            auth: { user: u, isAuthenticated: true },
                            balance: u.balance || 0,
                            lifetimeYield: u.lifetimeYield || 0,
                            level: u.level || 1,
                        };

                        // 3. Hydrate Streams (Merge Levels)
                        const currentStreams = get().streams; // Fresh from resetGame
                        const newStreams = { ...currentStreams };

                        if (u.streams) {
                            Object.entries(u.streams).forEach(([key, lvl]) => {
                                if (newStreams[key]) {
                                    newStreams[key] = { ...newStreams[key], level: lvl };
                                }
                            });
                        }
                        patch.streams = newStreams;

                        // 4. Recalculate YPS based on hydrated streams
                        const tempState = { ...get(), ...patch };
                        patch.yps = calculateIncome(tempState, 1);

                        // 5. Apply State
                        set(patch);

                        return { success: true };
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
            version: 1,
        }
    )
);
