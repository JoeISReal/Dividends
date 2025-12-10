import React from 'react';
import { useGameStore } from '../state/gameStore';

export default function TradeHistoryPage() {
    const tradeHistory = useGameStore((s) => s.tradeHistory);

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{
                fontSize: 24,
                fontWeight: 900,
                color: '#fff',
                marginBottom: 20,
                textTransform: 'uppercase',
                letterSpacing: '1px'
            }}>
                📊 Trade History
            </div>

            {!tradeHistory || tradeHistory.length === 0 ? (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(10,10,15,0.95) 0%, rgba(5,5,8,0.98) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.5)'
                }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
                    <div style={{ fontSize: 16, marginBottom: 8 }}>No trades yet</div>
                    <div style={{ fontSize: 13 }}>Your Degen Arena trade history will appear here</div>
                </div>
            ) : (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(10,10,15,0.95) 0%, rgba(5,5,8,0.98) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                    padding: '20px'
                }}>
                    <div style={{
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.5)',
                        marginBottom: 16,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>Total Trades: {tradeHistory.length}</span>
                        <span>Last 50 trades shown</span>
                    </div>

                    {tradeHistory.map((trade, index) => {
                        const priceChange = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice * 100).toFixed(2);
                        const isProfit = trade.pnl >= 0;

                        return (
                            <div key={index} style={{
                                background: isProfit ? 'rgba(59,255,176,0.05)' : 'rgba(255,75,106,0.05)',
                                border: `1px solid ${isProfit ? 'rgba(59,255,176,0.15)' : 'rgba(255,75,106,0.15)'}`,
                                borderRadius: 12,
                                padding: '16px',
                                marginBottom: 12
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                                            {new Date(trade.timestamp).toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                                            Trade #{tradeHistory.length - index}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: 20,
                                        fontWeight: 900,
                                        color: isProfit ? '#3bffb0' : '#ff6b81',
                                        textShadow: isProfit ? '0 0 12px rgba(59,255,176,0.4)' : '0 0 12px rgba(255,75,106,0.4)'
                                    }}>
                                        {isProfit ? '+' : ''}{trade.pnl.toFixed(2)}
                                    </div>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                                    gap: 12,
                                    fontSize: 11,
                                    background: 'rgba(0,0,0,0.2)',
                                    padding: '12px',
                                    borderRadius: 8
                                }}>
                                    <div>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Entry</div>
                                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{trade.entryPrice.toFixed(3)}x</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Exit</div>
                                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{trade.exitPrice.toFixed(3)}x</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Change</div>
                                        <div style={{
                                            color: parseFloat(priceChange) >= 0 ? '#3bffb0' : '#ff6b81',
                                            fontWeight: 700,
                                            fontSize: 13
                                        }}>
                                            {parseFloat(priceChange) >= 0 ? '+' : ''}{priceChange}%
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>ROI</div>
                                        <div style={{
                                            color: isProfit ? '#3bffb0' : '#ff6b81',
                                            fontWeight: 700,
                                            fontSize: 13
                                        }}>
                                            {((trade.pnl / trade.betAmount) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    fontSize: 11,
                                    color: 'rgba(255,255,255,0.3)',
                                    marginTop: 12,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    paddingTop: 12,
                                    borderTop: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <span>Bet Amount: <span style={{ color: '#ffd700', fontWeight: 600 }}>${trade.betAmount.toFixed(2)}</span></span>
                                    <span>Leverage: <span style={{ color: '#5be1ff', fontWeight: 600 }}>{trade.multiplier}x</span></span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
