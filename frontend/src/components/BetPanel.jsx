import React, { useState } from 'react';

export default function BetPanel({ onBuy, onSell, activePosition, balance }) {
    const [selectedAmount, setSelectedAmount] = useState(10);
    const [multiplier, setMultiplier] = useState(1);
    const betAmounts = [10, 25, 50, 100, 250, 500];
    const multipliers = [1, 2, 5, 10, 25, 50];

    const currentPnL = activePosition
        ? (activePosition.currentValue - activePosition.betAmount)
        : 0;

    const pnlPercent = activePosition
        ? ((currentPnL / activePosition.betAmount) * 100).toFixed(2)
        : 0;

    const positionMultiplier = activePosition
        ? (activePosition.currentValue / activePosition.betAmount).toFixed(3)
        : 0;

    const totalBet = selectedAmount * multiplier;
    const canAfford = totalBet <= balance;

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(10,10,15,0.95) 0%, rgba(5,5,8,0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
        }}>
            {/* Active Position - Compact */}
            {activePosition && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(59,255,176,0.08) 0%, rgba(34,197,94,0.05) 100%)',
                    border: '1px solid rgba(59,255,176,0.2)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    marginBottom: 16
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            POSITION
                        </span>
                        <div style={{
                            fontSize: 24,
                            fontWeight: 900,
                            color: positionMultiplier >= 1 ? '#3bffb0' : '#ff6b81',
                            textShadow: positionMultiplier >= 1 ? '0 0 12px rgba(59,255,176,0.4)' : '0 0 12px rgba(255,75,106,0.4)'
                        }}>
                            {positionMultiplier}x
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                        <div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Entry</div>
                            <div style={{ color: '#fff', fontWeight: 600 }}>${activePosition.betAmount.toFixed(2)}</div>
                        </div>
                        <div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>P/L</div>
                            <div style={{
                                color: currentPnL >= 0 ? '#3bffb0' : '#ff6b81',
                                fontWeight: 700
                            }}>
                                {currentPnL >= 0 ? '+' : ''}{currentPnL.toFixed(2)} ({pnlPercent}%)
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Balance */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.06)'
            }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>BALANCE</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#ffd700' }}>${balance.toFixed(2)}</span>
            </div>

            {/* Multiplier Selection */}
            <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    MULTIPLIER
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                    {multipliers.map(m => (
                        <button
                            key={m}
                            onClick={() => setMultiplier(m)}
                            style={{
                                padding: '8px 4px',
                                borderRadius: 8,
                                border: multiplier === m ? '2px solid #3bffb0' : '1px solid rgba(255,255,255,0.1)',
                                background: multiplier === m
                                    ? 'linear-gradient(135deg, rgba(59,255,176,0.2), rgba(34,197,94,0.15))'
                                    : 'rgba(255,255,255,0.03)',
                                color: multiplier === m ? '#3bffb0' : 'rgba(255,255,255,0.6)',
                                fontSize: 12,
                                fontWeight: multiplier === m ? 700 : 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: multiplier === m ? '0 0 12px rgba(59,255,176,0.2)' : 'none'
                            }}
                        >
                            {m}x
                        </button>
                    ))}
                </div>
            </div>

            {/* Bet Amount Selection */}
            <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    BASE BET
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {betAmounts.map(amount => (
                        <button
                            key={amount}
                            onClick={() => setSelectedAmount(amount)}
                            style={{
                                padding: '10px 8px',
                                borderRadius: 8,
                                border: selectedAmount === amount ? '2px solid #5be1ff' : '1px solid rgba(255,255,255,0.1)',
                                background: selectedAmount === amount
                                    ? 'linear-gradient(135deg, rgba(91,225,255,0.15), rgba(59,130,246,0.1))'
                                    : 'rgba(255,255,255,0.03)',
                                color: selectedAmount === amount ? '#5be1ff' : 'rgba(255,255,255,0.6)',
                                fontSize: 13,
                                fontWeight: selectedAmount === amount ? 700 : 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            ${amount}
                        </button>
                    ))}
                </div>
            </div>

            {/* Total Bet Display */}
            <div style={{
                padding: '12px',
                background: canAfford ? 'rgba(59,255,176,0.08)' : 'rgba(255,75,106,0.08)',
                border: `1px solid ${canAfford ? 'rgba(59,255,176,0.2)' : 'rgba(255,75,106,0.2)'}`,
                borderRadius: 10,
                marginBottom: 16,
                textAlign: 'center'
            }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>TOTAL BET</div>
                <div style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: canAfford ? '#3bffb0' : '#ff6b81'
                }}>
                    ${totalBet.toFixed(2)}
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: activePosition ? '1fr 1fr' : '1fr', gap: 10 }}>
                {activePosition && (
                    <button
                        onClick={onSell}
                        style={{
                            padding: '16px',
                            borderRadius: 12,
                            border: '2px solid rgba(255,75,106,0.6)',
                            background: 'linear-gradient(135deg, rgba(255,75,106,0.15), rgba(239,68,68,0.1))',
                            color: '#ff6b81',
                            fontSize: 15,
                            fontWeight: 800,
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            boxShadow: '0 4px 16px rgba(255,75,106,0.2)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(255,75,106,0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 16px rgba(255,75,106,0.2)';
                        }}
                    >
                        🔻 SELL
                    </button>
                )}
                <button
                    onClick={() => onBuy(totalBet)}
                    disabled={!canAfford}
                    style={{
                        padding: '16px',
                        borderRadius: 12,
                        border: canAfford ? '2px solid rgba(59,255,176,0.6)' : '2px solid rgba(255,255,255,0.1)',
                        background: canAfford
                            ? 'linear-gradient(135deg, rgba(59,255,176,0.2), rgba(34,197,94,0.15))'
                            : 'rgba(255,255,255,0.03)',
                        color: canAfford ? '#3bffb0' : 'rgba(255,255,255,0.3)',
                        fontSize: 15,
                        fontWeight: 800,
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: canAfford ? '0 4px 16px rgba(59,255,176,0.25)' : 'none',
                        transition: 'all 0.2s ease',
                        opacity: canAfford ? 1 : 0.5
                    }}
                    onMouseEnter={(e) => {
                        if (canAfford) {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(59,255,176,0.35)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (canAfford) {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 16px rgba(59,255,176,0.25)';
                        }
                    }}
                >
                    🚀 {activePosition ? 'BUY MORE' : 'BUY'}
                </button>
            </div>
        </div>
    );
}
