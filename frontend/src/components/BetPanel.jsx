import React, { useState } from 'react';
import { useSystemState } from '../hooks/useSystemState';

export default function BetPanel({ onBuy, onSell, activePosition, balance }) {
    const [selectedAmount, setSelectedAmount] = useState(10);
    const [multiplier, setMultiplier] = useState(1);
    const betAmounts = [10, 25, 50, 100, 250, 500];
    const multipliers = [1, 2, 5, 10, 25, 50];

    // Directive System State
    const { isLocked, risk } = useSystemState();

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

    // Lock Logic
    // If locked (Critical Instability), we disable Entry (Buy).
    // Allow Sell? Prompt says "Disable Arena entry, High-risk trade buttons".
    // Selling to exit is usually allowed (risk reduction). Buying is risk expansion.
    const isBuyDisabled = !canAfford || isLocked;

    return (
        <div className="surface-hud" style={{
            padding: '20px',
            marginBottom: 'var(--space-4)',
            border: isLocked ? '1px solid var(--accent-red)' : 'none',
            position: 'relative'
        }}>
            {/* Lock Overlay / Tooltip */}
            {isLocked && (
                <div style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--accent-red)',
                    color: '#000',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: 11,
                    fontWeight: 700,
                    zIndex: 10,
                    whiteSpace: 'nowrap'
                }}>
                    ⛔ SYSTEM UNSTABLE — ACTION RESTRICTED
                </div>
            )}

            {/* Active Position - Compact */}
            {activePosition && (
                <div style={{
                    background: 'rgba(59, 255, 176, 0.1)',
                    border: '1px solid rgba(59, 255, 176, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    marginBottom: 16
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            POSITION
                        </span>
                        <div style={{
                            fontSize: 24,
                            fontWeight: 900,
                            color: positionMultiplier >= 1 ? 'var(--accent-green)' : 'var(--accent-red)',
                            textShadow: positionMultiplier >= 1 ? '0 0 12px rgba(59,255,176,0.4)' : '0 0 12px rgba(255,75,106,0.4)'
                        }}>
                            {positionMultiplier}x
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>Entry</div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>${activePosition.betAmount.toFixed(2)}</div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>P/L</div>
                            <div style={{
                                color: currentPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
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
                background: 'var(--bg-panel-soft)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
            }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>BALANCE</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-gold)' }}>${balance.toFixed(2)}</span>
            </div>

            {/* Multiplier Selection */}
            <div style={{ marginBottom: 14, opacity: isLocked ? 0.5 : 1, pointerEvents: isLocked ? 'none' : 'auto' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    MULTIPLIER
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                    {multipliers.map(m => (
                        <button
                            key={m}
                            onClick={() => setMultiplier(m)}
                            className={multiplier === m ? 'btn-action-economic' : 'btn-action-meta'}
                            style={{
                                padding: '8px 4px',
                                fontSize: 12,
                                fontWeight: 600,
                                background: multiplier === m ? 'var(--accent-green)' : 'var(--bg-panel-soft)',
                                color: multiplier === m ? '#000' : 'var(--text-secondary)',
                                border: multiplier === m ? '1px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                                cursor: 'pointer',
                                transition: 'all 0.1s ease'
                            }}
                        >
                            {m}x
                        </button>
                    ))}
                </div>
            </div>

            {/* Bet Amount Selection */}
            <div style={{ marginBottom: 18, opacity: isLocked ? 0.5 : 1, pointerEvents: isLocked ? 'none' : 'auto' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    BASE BET
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {betAmounts.map(amount => (
                        <button
                            key={amount}
                            onClick={() => setSelectedAmount(amount)}
                            className={selectedAmount === amount ? 'btn-action-economic' : 'btn-action-meta'}
                            style={{
                                padding: '10px 8px',
                                fontSize: 13,
                                fontWeight: 600,
                                background: selectedAmount === amount ? 'var(--accent-blue)' : 'var(--bg-panel-soft)',
                                color: selectedAmount === amount ? '#000' : 'var(--text-secondary)',
                                borderColor: selectedAmount === amount ? 'var(--accent-blue)' : 'var(--border-subtle)',
                                borderStyle: 'solid',
                                borderWidth: '1px',
                                cursor: 'pointer',
                                transition: 'all 0.1s ease'
                            }}
                        >
                            ${amount}
                        </button>
                    ))}
                </div>

                {/* Custom Amount Input */}
                <div style={{ marginTop: 10 }}>
                    <input
                        type="number"
                        placeholder="Or enter custom amount..."
                        value={selectedAmount}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setSelectedAmount(Math.max(0, val));
                        }}
                        onFocus={(e) => e.target.select()}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-panel-soft)',
                            color: 'var(--text-primary)',
                            fontSize: 14,
                            fontWeight: 600,
                            outline: 'none',
                            transition: 'all 0.2s ease',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>
            </div>

            {/* Total Bet Display */}
            <div style={{
                padding: '12px',
                background: canAfford ? 'rgba(59, 255, 176, 0.1)' : 'rgba(255, 75, 106, 0.1)',
                border: `1px solid ${canAfford ? 'rgba(59, 255, 176, 0.2)' : 'rgba(255, 75, 106, 0.2)'}`,
                borderRadius: 10,
                marginBottom: 16,
                textAlign: 'center',
                opacity: isLocked ? 0.5 : 1
            }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>TOTAL BET</div>
                <div style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: canAfford ? 'var(--accent-green)' : 'var(--accent-red)'
                }}>
                    ${totalBet.toFixed(2)}
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: activePosition ? '1fr 1fr' : '1fr', gap: 10 }}>
                {activePosition && (
                    <button
                        onClick={onSell}
                        className="btn-danger"
                        style={{ padding: '16px', fontSize: 15 }}
                    >
                        🔻 SELL
                    </button>
                )}
                {/* TOOLTIP ON HOVER if Locked? Already added overlay label above. */}
                <div style={{ position: 'relative', width: '100%' }}>
                    <button
                        onClick={() => !isLocked && onBuy(totalBet)}
                        disabled={isBuyDisabled}
                        className="btn-action-economic"
                        style={{
                            width: '100%',
                            padding: '16px',
                            fontSize: 15,
                            background: isLocked ? 'var(--bg-panel-soft)' : (canAfford ? 'var(--accent-green)' : 'var(--bg-panel-soft)'),
                            opacity: isBuyDisabled ? 0.5 : 1,
                            cursor: isBuyDisabled ? 'not-allowed' : 'pointer',
                            border: isLocked ? '1px solid var(--accent-red)' : 'none',
                            color: isLocked ? 'var(--accent-red)' : (canAfford ? '#000' : 'var(--text-secondary)')
                        }}
                    >
                        {isLocked ? '⛔ LOCKED' : (
                            <>🚀 {activePosition ? 'BUY MORE' : 'BUY'}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
