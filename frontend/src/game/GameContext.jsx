import React, { createContext, useContext, useEffect, useState, useRef } from "react";

const KEY = "divs_ac_v2";
const GameContext = createContext(null);
export function useGame() { return useContext(GameContext) }

const defaultStreams = [
    {
        id: 'shitpost', name: 'Shitpost Stream', icon: '💩',
        baseCost: 10, costScale: 1.15, baseYield: 1, yieldScale: 1.07,
        baseTime: 1, owned: 0, hasManager: false,
        unlocks: [
            { owned: 25, type: 'profit', multiplier: 2 },
            { owned: 50, type: 'speed', multiplier: 2 },
            { owned: 100, type: 'profit', multiplier: 3 },
            { owned: 200, type: 'profit', multiplier: 2 },
            { owned: 300, type: 'profit', multiplier: 2 }
        ]
    },
    {
        id: 'engagement', name: 'Engagement Bait Farm', icon: '🎣',
        baseCost: 100, costScale: 1.15, baseYield: 60, yieldScale: 1.07,
        baseTime: 3, owned: 0, hasManager: false,
        unlocks: [
            { owned: 25, type: 'profit', multiplier: 2 },
            { owned: 50, type: 'speed', multiplier: 2 },
            { owned: 100, type: 'profit', multiplier: 3 }
        ]
    },
    {
        id: 'pump', name: 'Pump Radar Scanner', icon: '📡',
        baseCost: 1100, costScale: 1.14, baseYield: 540, yieldScale: 1.07,
        baseTime: 6, owned: 0, hasManager: false,
        unlocks: [
            { owned: 25, type: 'profit', multiplier: 2 },
            { owned: 50, type: 'speed', multiplier: 2 },
            { owned: 100, type: 'profit', multiplier: 3 }
        ]
    },
    {
        id: 'nft', name: 'NFT Flip Machine', icon: '🖼️',
        baseCost: 12000, costScale: 1.13, baseYield: 4320, yieldScale: 1.07,
        baseTime: 12, owned: 0, hasManager: false,
        unlocks: [
            { owned: 25, type: 'profit', multiplier: 2 },
            { owned: 50, type: 'speed', multiplier: 2 },
            { owned: 100, type: 'profit', multiplier: 3 }
        ]
    },
    {
        id: 'algo', name: 'Algo Trader Bot', icon: '🤖',
        baseCost: 130000, costScale: 1.12, baseYield: 51840, yieldScale: 1.07,
        baseTime: 24, owned: 0, hasManager: false,
        unlocks: [
            { owned: 25, type: 'profit', multiplier: 2 },
            { owned: 50, type: 'speed', multiplier: 2 },
            { owned: 100, type: 'profit', multiplier: 3 }
        ]
    },
    {
        id: 'sentiment', name: 'Sentiment Oracle', icon: '🔮',
        baseCost: 1400000, costScale: 1.11, baseYield: 622080, yieldScale: 1.07,
        baseTime: 96, owned: 0, hasManager: false,
        unlocks: [
            { owned: 25, type: 'profit', multiplier: 2 },
            { owned: 50, type: 'speed', multiplier: 2 },
            { owned: 100, type: 'profit', multiplier: 3 }
        ]
    }
];

const managers = [
    { id: 'mgr_shitpost', streamId: 'shitpost', name: 'Chad Poster', cost: 1000 },
    { id: 'mgr_engagement', streamId: 'engagement', name: 'Engagement Expert', cost: 15000 },
    { id: 'mgr_pump', streamId: 'pump', name: 'Pump Detective', cost: 100000 },
    { id: 'mgr_nft', streamId: 'nft', name: 'NFT Degen', cost: 500000 },
    { id: 'mgr_algo', streamId: 'algo', name: 'Bot Operator', cost: 10000000 },
    { id: 'mgr_sentiment', streamId: 'sentiment', name: 'Oracle Master', cost: 100000000 }
];

const upgradesCatalog = [
    { key: 'faster_clicks', name: 'Faster Clicks', desc: '+1 click yield', cost: 500, costScale: 1.5, type: 'global' },
    { key: 'shitpost_boost', name: 'Viral Content', desc: 'Shitpost profit ×2', cost: 5000, costScale: 2.5, type: 'stream', target: 'shitpost' },
    { key: 'global_mult', name: 'Tokenomics R&D', desc: 'All profits +10%', cost: 50000, costScale: 1.8, type: 'global' }
];

function createInitialState() {
    return {
        balance: 100, // Start with 100 for testing
        yieldPerClick: 1,
        yieldPerSecond: 0,
        shareholderMultiplier: 1,
        streams: JSON.parse(JSON.stringify(defaultStreams)), // Deep copy
        managers: JSON.parse(JSON.stringify(managers)),
        upgradesCatalog: JSON.parse(JSON.stringify(upgradesCatalog)),
        upgrades: {},
        ownedManagers: [],
        stats: { lifetimeYield: 0, totalClicks: 0 },
        lastActive: Date.now(),
        perps: {
            activePosition: null,
            history: [],
            stats: { wins: 0, losses: 0, bestWin: 0, totalPnL: 0 }
        }
    };
}

export function GameProvider({ children }) {
    const [loaded, setLoaded] = useState(false);
    const [state, setState] = useState(null);
    const [buyAmount, setBuyAmount] = useState(1);
    const flashRef = useRef(null);

    useEffect(() => {
        const raw = localStorage.getItem(KEY);
        if (raw) {
            try {
                const saved = JSON.parse(raw);
                // Merge with defaults to add new streams/managers
                saved.streams = defaultStreams.map(ds => {
                    const existing = saved.streams?.find(s => s.id === ds.id);
                    return existing ? { ...ds, owned: existing.owned, hasManager: existing.hasManager } : ds;
                });
                saved.managers = managers;
                saved.upgradesCatalog = upgradesCatalog;

                // Ensure perps state exists
                if (!saved.perps) {
                    saved.perps = {
                        activePosition: null,
                        history: [],
                        stats: { wins: 0, losses: 0, bestWin: 0, totalPnL: 0 }
                    };
                }

                setState(saved);
                setLoaded(true);
                return;
            } catch (e) {
                console.error('Failed to load saved state:', e);
            }
        }
        // initial
        const initial = createInitialState();
        setState(initial);
        setLoaded(true);
    }, []);

    useEffect(() => {
        if (!loaded || state == null) return;
        localStorage.setItem(KEY, JSON.stringify(state));
    }, [state, loaded]);

    const actions = {
        addBalance: (delta) => {
            console.log('addBalance called with:', delta, 'current:', state?.balance);
            setState(s => {
                const newBalance = Number(s.balance || 0) + Number(delta);
                const newLifetime = (s.stats.lifetimeYield || 0) + Math.max(0, delta);
                console.log('New balance will be:', newBalance);
                return {
                    ...s,
                    balance: newBalance,
                    stats: { ...s.stats, lifetimeYield: newLifetime }
                };
            });
        },
        addStream: (id, n = 1) => {
            console.log('addStream called:', id, 'qty:', n);
            setState(s => ({
                ...s,
                streams: s.streams.map(st => st.id === id ? { ...st, owned: st.owned + n } : st)
            }));
        },
        buyUpgrade: (key) => setState(s => {
            const newUpgrades = { ...s.upgrades, [key]: (s.upgrades[key] || 0) + 1 };
            let newYPC = s.yieldPerClick;

            // Handle specific upgrade effects
            if (key === 'faster_clicks') {
                newYPC = (s.yieldPerClick || 1) + 1;
            }

            return {
                ...s,
                upgrades: newUpgrades,
                yieldPerClick: newYPC
            };
        }),
        buyManager: (id) => {
            console.log('buyManager called:', id);
            setState(s => {
                const mgr = s.managers.find(m => m.id === id);
                if (!mgr) return s;
                return {
                    ...s,
                    ownedManagers: [...s.ownedManagers, id],
                    streams: s.streams.map(st => st.id === mgr.streamId ? { ...st, hasManager: true } : st)
                };
            });
        },
        setYPS: (v) => setState(s => ({ ...s, yieldPerSecond: v })),
        setYPC: (v) => setState(s => ({ ...s, yieldPerClick: v })),
        incrementStat: (k, v = 1) => setState(s => ({ ...s, stats: { ...s.stats, [k]: (s.stats[k] || 0) + v } })),
        prestige: () => setState(s => {
            const bonus = Math.max(0, Math.floor(Math.log10(Math.max(1, s.stats.lifetimeYield))) * 0.25);
            return {
                ...s,
                balance: 0,
                streams: s.streams.map(st => ({ ...st, owned: 0, hasManager: false })),
                upgrades: {},
                ownedManagers: [],
                shareholderMultiplier: (s.shareholderMultiplier || 1) + bonus,
                stats: { lifetimeYield: 0, totalClicks: 0 },
                lastActive: Date.now()
            }
        }),
        resetGame: () => {
            console.log('RESETTING GAME');
            localStorage.removeItem(KEY);
            const initial = createInitialState();
            setState(initial);
        },
        flashError: (msg) => {
            flashRef.current = msg;
            setTimeout(() => flashRef.current = null, 1200);
            console.warn("Game flash:", msg);
        },
        // Perps Actions
        openPosition: (position) => setState(s => {
            const existing = s.perps.activePosition;
            let newPos = { ...position, entryTime: Date.now() };
            let amountToDeduct = position.amount; // Track the actual amount to deduct from balance

            if (existing) {
                if (existing.direction === position.direction) {
                    // Add to existing position (Weighted Average)
                    const totalAmount = existing.amount + position.amount;
                    const weightedEntry = ((existing.amount * existing.entryPrice) + (position.amount * position.entryPrice)) / totalAmount;

                    newPos = {
                        ...existing,
                        amount: totalAmount,
                        entryPrice: weightedEntry,
                        // Keep existing leverage to avoid complexity
                        leverage: existing.leverage
                    };
                    // Only deduct the NEW amount being added, not the total
                    amountToDeduct = position.amount;
                } else {
                    // Opposite direction? For now, let's just overwrite (close & flip)
                    // Or ideally, we should prevent this in UI. 
                    // But to be safe, let's just overwrite as before if direction differs.
                    newPos = { ...position, entryTime: Date.now() };
                    amountToDeduct = position.amount;
                }
            }

            return {
                ...s,
                balance: s.balance - amountToDeduct,
                perps: {
                    ...s.perps,
                    activePosition: newPos
                }
            };
        }),
        closePosition: ({ pnl, fraction = 1 }) => setState(s => {
            const pos = s.perps.activePosition;
            if (!pos) return s;

            // Calculate portion of margin to return
            const marginRemoved = pos.amount * fraction;
            const payout = marginRemoved + pnl;

            // Update History (record this partial/full trade)
            const historyEntry = {
                ...pos,
                amount: marginRemoved, // Record only the amount closed
                pnl,
                result: pnl > 0 ? 'win' : 'loss',
                closeTime: Date.now(),
                type: fraction < 1 ? 'partial' : 'close'
            };

            const newHistory = [historyEntry, ...(s.perps.history || [])].slice(0, 50);

            // Update Stats
            const newStats = {
                ...s.perps.stats,
                wins: (s.perps.stats?.wins || 0) + (pnl > 0 ? 1 : 0),
                losses: (s.perps.stats?.losses || 0) + (pnl <= 0 ? 1 : 0),
                bestWin: Math.max(s.perps.stats?.bestWin || 0, pnl),
                totalPnL: (s.perps.stats?.totalPnL || 0) + pnl
            };

            // Determine new active position state
            let newActivePos = null;
            if (fraction < 1 && (pos.amount - marginRemoved) > 0.01) {
                // Keep remaining position
                newActivePos = {
                    ...pos,
                    amount: pos.amount - marginRemoved
                };
            }

            return {
                ...s,
                balance: s.balance + payout,
                perps: {
                    ...s.perps,
                    activePosition: newActivePos,
                    history: newHistory,
                    stats: newStats
                }
            };
        }),
        liquidatePosition: () => setState(s => {
            const pos = s.perps.activePosition;
            if (!pos) return s;
            return {
                ...s,
                perps: {
                    ...s.perps,
                    activePosition: null,
                    history: [{ ...pos, pnl: -pos.amount, result: 'liquidated' }, ...(s.perps.history || [])].slice(0, 50),
                    stats: {
                        ...s.perps.stats,
                        losses: (s.perps.stats?.losses || 0) + 1,
                        totalPnL: (s.perps.stats?.totalPnL || 0) - pos.amount
                    }
                }
            };
        })
    };

    return (
        <GameContext.Provider value={{ state, actions, loaded, flashRef, buyAmount, setBuyAmount }}>
            {children}
        </GameContext.Provider>
    );
}
