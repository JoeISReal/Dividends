import React from 'react';

export default function TradeHistory({ trades }) {
    if (!trades || trades.length === 0) {
        return (
            <div style={{
                background: 'linear-gradient(135deg, rgba(10,10,15,0.95) 0%, rgba(5,5,8,0.98) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: '20px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.5)'
            }}>
                <div style={{ fontSize: 14 }}>No trades yet</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Your trade history will appear here</div>
            </div>
        );
    }

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(10,10,15,0.95) 0%, rgba(5,5,8,0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: '16px',
            maxHeight: '400px',
            overflowY: 'auto'
        }}>
            <div style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
            }}>
                Trade History ({trades.length})
            </div>

            {trades.map((trade, index) => {
                const priceChange = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice * 100).toFixed(2);
                const isProfit = trade.pnl >= 0;

                return (
                    <div key={index} style={{
                        background: isProfit ? 'rgba(59,255,176,0.05)' : 'rgba(255,75,106,0.05)',
                        border: `1px solid ${isProfit ? 'rgba(59,255,176,0.15)' : 'rgba(255,75,106,0.15)'}`,
                        borderRadius: 8,
                        padding: '10px 12px',
                        marginBottom: 8
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                                {new Date(trade.timestamp).toLocaleTimeString()}
                            </div>
                            <div style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: isProfit ? '#3bffb0' : '#ff6b81'
                            }}>
                                {isProfit ? '+' : ''}{trade.pnl.toFixed(2)}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 10 }}>
                            <div>
                                <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Entry</div>
                                <div style={{ color: '#fff', fontWeight: 600 }}>{trade.entryPrice.toFixed(3)}x</div>
                            </div>
                            <div>
                                <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Exit</div>
                                <div style={{ color: '#fff', fontWeight: 600 }}>{trade.exitPrice.toFixed(3)}x</div>
                            </div>
                            <div>
                                <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Change</div>
                                <div style={{
                                    color: parseFloat(priceChange) >= 0 ? '#3bffb0' : '#ff6b81',
                                    fontWeight: 600
                                }}>
                                    {priceChange}%
                                </div>
                            </div>
                        </div>

                        <div style={{
                            fontSize: 10,
                            color: 'rgba(255,255,255,0.3)',
                            marginTop: 6,
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}>
                            <span>Bet: ${trade.betAmount.toFixed(2)}</span>
                            <span>{trade.multiplier}x Leverage</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
