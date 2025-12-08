// src/state/gameStore.js
// Unified game state management with Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
            },

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
                const baseYps = Object.values(state.streams).reduce(
                    (sum, s) => sum + s.level * s.baseYps,
                    0
                );
                const realYps = baseYps * state.multipliers.prestige * state.multipliers.global;

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

                set({
                    balance: state.balance - cost,
                    managers: {
                        ...state.managers,
                        [streamKey]: true,
                    },
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

                    // Recalculate YPS with new multiplier
                    const baseYps = Object.values(state.streams).reduce(
                        (sum, s) => sum + s.level * s.baseYps,
                        0
                    );
                    const realYps = baseYps * state.multipliers.prestige * newGlobalMult;

                    set({
                        balance: state.balance - cost,
                        multipliers: {
                            ...state.multipliers,
                            global: newGlobalMult,
                        },
                        yps: realYps,
                        upgrades: {
                            ...state.upgrades,
                            globalLevel: state.upgrades.globalLevel + 1,
                        },
                        stats: {
                            ...state.stats,
                            totalUpgradesBought: state.stats.totalUpgradesBought + 1,
                        },
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

            applyArenaResult: (pnl) => {
                const state = get();
                const isWin = pnl > 0;

                set({
                    balance: state.balance + pnl,
                    arena: {
                        lastEntry: state.arena.lastEntry,
                        lastExit: Date.now(),
                        lastPnL: pnl,
                        totalPnL: state.arena.totalPnL + pnl,
                    },
                    stats: {
                        ...state.stats,
                        totalArenaTradesWon: state.stats.totalArenaTradesWon + (isWin ? 1 : 0),
                        totalArenaTradesLost: state.stats.totalArenaTradesLost + (isWin ? 0 : 1),
                    },
                });
            },

            setArenaEntry: (amount) => {
                set({
                    arena: {
                        ...get().arena,
                        lastEntry: amount,
                    },
                });
            },

            /* ========================
               UTILITY
            ======================== */

            resetGame: () => {
                set({
                    balance: 100,
                    yps: 0,
                    yieldPerClick: 1,
                    totalClicks: 0,
                    lifetimeYield: 0,
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
                    arena: {
                        lastEntry: null,
                        lastExit: null,
                        lastPnL: 0,
                        totalPnL: 0,
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

        }),
        {
            name: 'dividends-game-state',
            version: 1,
        }
    )
);
