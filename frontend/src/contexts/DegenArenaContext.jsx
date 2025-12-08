import React, { createContext, useContext, useState } from 'react';
import { useGame } from '../game/GameContext';

const DegenArenaContext = createContext();

export function DegenArenaProvider({ children }) {
    const { state, actions } = useGame();
    const [activePosition, setActivePosition] = useState(null);
    const [currentPrice, setCurrentPrice] = useState(1.0);
    const [isRugged, setIsRugged] = useState(false);

    // Handle price updates from chart
    const handlePriceUpdate = (price) => {
        setCurrentPrice(price);

        // Update active position value
        if (activePosition && !isRugged) {
            const multiplier = price / activePosition.entryPrice;
            setActivePosition(prev => ({
                ...prev,
                currentValue: prev.betAmount * multiplier
            }));
        }
    };

    // Handle rug event
    const handleRug = () => {
        setIsRugged(true);
        if (activePosition) {
            setActivePosition(prev => ({
                ...prev,
                currentValue: 0
            }));
        }
    };

    // Handle BUY action
    const handleBuy = (amount) => {
        if (amount > state.balance || activePosition) return;

        // Deduct from game balance
        actions.addBalance(-amount);

        setActivePosition({
            betAmount: amount,
            entryPrice: currentPrice,
            currentValue: amount
        });

        setIsRugged(false);
    };

    // Handle SELL action
    const handleSell = () => {
        if (!activePosition) return;

        const profit = activePosition.currentValue - activePosition.betAmount;

        // Add current value back to game balance
        actions.addBalance(activePosition.currentValue);

        // Add 1% of profit to YPS (if profitable)
        if (profit > 0) {
            console.log('Profit earned:', profit);
        }

        setActivePosition(null);
    };

    const value = {
        currentPrice,
        isRugged,
        activePosition,
        balance: state.balance,
        handlePriceUpdate,
        handleRug,
        handleBuy,
        handleSell
    };

    return (
        <DegenArenaContext.Provider value={value}>
            {children}
        </DegenArenaContext.Provider>
    );
}

export function useDegenArena() {
    const context = useContext(DegenArenaContext);
    if (!context) {
        throw new Error('useDegenArena must be used within DegenArenaProvider');
    }
    return context;
}
