import React, { useState, useEffect } from 'react';

export default function LiveDegensList({ currentPrice = 1.0, isRugged = false }) {
    const [degens, setDegens] = useState([]);
    const [gameHistory, setGameHistory] = useState([]);

    // Generate initial fake bot players
    useEffect(() => {
        const botNames = [
            'CryptoKing', 'MoonBoy420', 'DiamondHands', 'PaperHands',
            'WhaleWatcher', 'DipBuyer', 'HODL_Master', 'RugPuller69',
            'LamboSoon', 'ToTheMoon', 'SatoshiStan', 'VitalikFan'
        ];

        const generateBots = () => {
            const numBots = 6 + Math.floor(Math.random() * 4);
            return Array.from({ length: numBots }, (_, i) => ({
                id: i,
                name: botNames[Math.floor(Math.random() * botNames.length)],
                entryPrice: 0.8 + Math.random() * 0.4, // Random entry between 0.8x - 1.2x
                isActive: true
            }));
        };

        setDegens(generateBots());
    }, []);

    // Update multipliers based on current price
    useEffect(() => {
        if (isRugged) {
            // When rugged, all active positions go to 0x
            setDegens(prev => prev.map(bot => ({
                ...bot,
                isActive: false,
                finalMult: 0
            })));

            // Add to history
            setGameHistory(prev => [...prev.slice(-99), {
                timestamp: Date.now(),
                multiplier: 0,
                rugged: true
            }]);
        }
    }, [isRugged]);

    // Calculate current multipliers
    const displayDegens = degens.map(bot => {
        if (!bot.isActive && bot.finalMult !== undefined) {
            return {
                ...bot,
                mult: bot.finalMult
            };
        }
        const mult = currentPrice / bot.entryPrice;
        return {
            ...bot,
            mult: mult
        };
    });

    return (
        <>
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>
                    Live Positions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {displayDegens.map(degen => (
                        <div key={degen.id} className="degen-row">
                            <span className="degen-name">
                                {degen.name}
                                {!degen.isActive && <span style={{ marginLeft: 4, opacity: 0.5 }}>💀</span>}
                            </span>
                            <span className={`degen-pnl ${degen.mult >= 1 ? 'degen-pnl--up' : 'degen-pnl--down'}`}>
                                {degen.mult.toFixed(2)}x
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {gameHistory.length > 0 && (
                <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>
                        Recent Rounds
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {gameHistory.slice(-10).reverse().map((game, i) => (
                            <div key={i} style={{
                                padding: "6px 8px",
                                background: "rgba(255,255,255,0.02)",
                                borderRadius: 6,
                                fontSize: 12,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                                <span style={{ color: "var(--text-muted)" }}>
                                    {game.rugged ? '💀 Rugged' : '✓ Cashed'}
                                </span>
                                <span style={{
                                    color: game.multiplier >= 2 ? "var(--accent-green)" :
                                        game.multiplier >= 1 ? "var(--accent-gold)" :
                                            "var(--accent-red)",
                                    fontWeight: 600
                                }}>
                                    {game.multiplier.toFixed(2)}x
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
