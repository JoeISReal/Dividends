// frontend/src/context/GameContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'

const PLAYER_KEY = 'divs_player_v1'
const GameContext = createContext(null)

export function useGame() { return useContext(GameContext) }

export function GameProvider({ children }) {
    const [state, setState] = useState(null)
    const [loaded, setLoaded] = useState(false)

    // default template (if no backend)
    const defaultState = {
        playerId: 'player1',
        balance: 0,
        yieldPerClick: 1,
        yieldPerSecond: 0,
        shareholderMultiplier: 1,
        streams: [],    // streams metadata + quantity
        upgrades: {},   // key -> level
        lastActive: Date.now(),
        stats: { lifetimeYield: 0, totalClicks: 0, cansOpened: 0 }
    }

    useEffect(() => {
        // load from localStorage first
        const raw = localStorage.getItem(PLAYER_KEY)
        if (raw) {
            try { setState(JSON.parse(raw)); setLoaded(true); return; } catch (e) {/*fallthrough*/ }
        }
        setState(defaultState); setLoaded(true)
    }, [])

    useEffect(() => {
        if (!loaded || !state) return
        localStorage.setItem(PLAYER_KEY, JSON.stringify(state))
    }, [state, loaded])

    const actions = {
        setState,
        patch: (patch) => setState(s => ({ ...s, ...patch })),
        addBalance: (amount) => setState(s => {
            const ns = { ...s, balance: Number(s.balance) + Number(amount) }
            ns.stats = { ...ns.stats, lifetimeYield: (ns.stats.lifetimeYield || 0) + Number(Math.max(0, amount)) }
            return ns
        }),
        buyStreamLocal: (streamId, amount = 1) => {
            setState(s => {
                const streams = s.streams.map(st => st.id === streamId ? ({ ...st, quantity: st.quantity + amount }) : st)
                return { ...s, streams }
            })
        },
        buyUpgradeLocal: (key, levelUp = 1) => setState(s => {
            const upgrades = { ...s.upgrades, [key]: (s.upgrades[key] || 0) + levelUp }
            return { ...s, upgrades }
        }),
        setStreams: (streams) => setState(s => ({ ...s, streams }))
    }

    return (
        <GameContext.Provider value={{ state, actions, loaded }}>
            {children}
        </GameContext.Provider>
    )
}
