import React, { useState, useEffect } from 'react';
import { useGameStore } from '../state/gameStore';
import { calculateIncome } from '../game/incomeEngineFixed';

export default function DebugOverlay() {
    const [visible, setVisible] = useState(false);
    const store = useGameStore();

    // Force re-render every second to show live changes
    const [, setTick] = useState(0);
    useEffect(() => {
        const i = setInterval(() => setTick(t => t + 1), 500);
        return () => clearInterval(i);
    }, []);

    const toggle = () => setVisible(!visible);

    if (!visible) {
        return (
            <button
                onClick={toggle}
                style={{
                    position: 'fixed',
                    bottom: 10,
                    right: 10,
                    zIndex: 9999,
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    fontSize: 10,
                    opacity: 0.7
                }}
            >
                DEBUG
            </button>
        );
    }

    const calculatedYPS = calculateIncome(store, 1);

    return (
        <div style={{
            position: 'fixed',
            top: 10,
            right: 10,
            width: 300,
            height: '80vh',
            background: 'rgba(0,0,0,0.9)',
            border: '1px solid red',
            color: '#0f0',
            fontFamily: 'monospace',
            fontSize: 11,
            zIndex: 9999,
            padding: 10,
            overflowY: 'auto'
        }}>
            <button onClick={toggle} style={{ float: 'right', background: 'red' }}>X</button>
            <h3>DEBUG STATE</h3>
            <div style={{ marginBottom: 10 }}>
                <strong>Store YPS:</strong> {store.yps}<br />
                <strong>Calc YPS:</strong> {calculatedYPS}<br />
                <strong>Balance:</strong> {store.balance}<br />
                <strong>LastActive:</strong> {store.lastActive}
            </div>

            <h4>Managers</h4>
            <pre>{JSON.stringify(store.managers, null, 2)}</pre>

            <h4>Streams</h4>
            {Object.entries(store.streams).map(([key, s]) => (
                <div key={key} style={{ borderBottom: '1px solid #333', padding: '2px 0' }}>
                    <strong>{key}</strong>: Lvl {s.level} | Owned {s.owned} <br />
                    HasManager: {s.hasManager ? 'TRUE' : 'FALSE'}
                </div>
            ))}
            <h4>Upgrades</h4>
            <pre>{JSON.stringify(store.upgrades, null, 2)}</pre>
        </div>
    );
}
