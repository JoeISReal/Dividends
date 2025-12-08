// frontend/src/hooks/useGameLoop.js
import { useEffect, useRef } from 'react'
import { useGame } from '../context/GameContext'

export default function useGameLoop(tickMs = 1000) {
    const { state, actions, loaded } = useGame()
    const stateRef = useRef(null)
    const intervalRef = useRef(null)

    // keep latest state in ref for interval closure
    useEffect(() => {
        stateRef.current = state
    }, [state])

    useEffect(() => {
        if (!loaded || !stateRef.current) return

        // offline earnings once on startup
        const now = Date.now()
        const last = stateRef.current.lastActive || now
        const offlineSec = Math.floor((now - last) / 1000)
        if (offlineSec > 1) {
            const ypsNow = computeYPS(stateRef.current)
            const owed = ypsNow * offlineSec
            if (owed > 0) actions.addBalance(owed)
        }
        actions.patch({ lastActive: now })

        intervalRef.current = setInterval(() => {
            const s = stateRef.current
            if (!s) return
            const yps = computeYPS(s)
            if (yps > 0) actions.addBalance(yps * (tickMs / 1000))
            actions.patch({ yieldPerSecond: yps, lastActive: Date.now() })
        }, tickMs)

        return () => clearInterval(intervalRef.current)
    }, [loaded, actions, tickMs])

    function computeYPS(s) {
        if (!s) return 0
        let base = 0
        s.streams?.forEach(st => {
            const globalBoost = 1 + ((s.upgrades?.global_multiplier || 0) * 0.05)
            const streamBoost = 1 + ((s.upgrades?.[`${st.id}_multiplier`] || 0) * 0.1)
            base += ((st.baseYield * st.quantity) / st.productionTime) * globalBoost * streamBoost
        })
        base *= (s.shareholderMultiplier || 1)
        return base
    }

    return null
}
