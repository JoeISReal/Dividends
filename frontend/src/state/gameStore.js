// src/state/gameStore.js
// Unified game state management with Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateIncome } from '../game/incomeEngineFixed';

const API_BASE = import.meta.env.VITE_API_URL || '';


export const useGameStore = create(
    persist(
        (set, get) => ({

            /* ========================
               CORE ECONOMY
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
                        body: JSON.stringify({
                            handle: state.auth.user.handle,
                            newDisplayName: newName
                        })
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
                        return { success: false, error: `Server Error (${res.status}): Endpoint likely not found` };
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
                    return { success: false, error: `Connection failed: ${e.message}` };
                }
            },

            login: async (handle) => {
                try {
                    // Use relative path for Vercel functions
                    // Use relative path for Vercel functions, or absolute for Render
                    const res = await fetch(`${API_BASE}/api/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ handle })
                    });

                    if (!res.ok) {
                        const errText = await res.text();
                        return { success: false, error: `Server error: ${res.status} ${res.statusText} - ${errText.substring(0, 50)}` };
                    }

                    const data = await res.json();
                    if (data.success) {
                        set({
                            auth: { user: data.user, isAuthenticated: true },
                            // Optimistically set level from DB if available
                            level: data.user.level || 1,
                        });
                        return { success: true };
                    }
                    return { success: false, error: data.error || "Unknown server error" };
                } catch (e) {
                    console.error("Login failed (Is backend running?)", e);
                    return { success: false, error: `Connection failed: ${e.message}` };
                }
            },

            logout: () => {
                set({
                    auth: { user: null, isAuthenticated: false }
                });
            },

            syncScore: async () => {
                const state = get();
                if (!state.auth.isAuthenticated) return;

                try {
                    // Unified call: Send Score -> Get Leaderboard
                    // Unified call: Send Score -> Get Leaderboard
                    const res = await fetch(`${API_BASE}/api/sync`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            handle: state.auth.user.handle.replace(/^@/, ''),
                            balance: state.balance,
                            lifetimeYield: state.lifetimeYield,
                            level: state.level // Send Level
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        // Update leaderboard immediately from response
                        if (data.leaderboard) {
                            set({ leaderboard: data.leaderboard });
                        }
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
                    // or just send empty/partial to just read. 
                    // Let's send current stats if we have them to keep "User alive"

                    const payload = {};
                    if (state.auth.isAuthenticated) {
                        payload.handle = state.auth.user.handle.replace(/^@/, '');
                        payload.balance = state.balance;
                        payload.lifetimeYield = state.lifetimeYield;
                        payload.level = state.level;
                    }

                    const res = await fetch(`${API_BASE}/api/sync`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                        const data = await res.json();
                        set({ leaderboard: data.leaderboard });
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
