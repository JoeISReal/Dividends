import React from 'react';

export default function TradeHistoryList({ tradeHistory, limit = 50 }) {
    if (!tradeHistory || tradeHistory.length === 0) {
        return (
            <div style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 16,
                padding: '40px 20px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.5)'
            }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📈</div>
                <div style={{ fontSize: 14 }}>No trades yet</div>
            </div>
        );
    }

    // Sort by newest first and limit
    const displayTrades = [...tradeHistory].reverse().slice(0, limit);

    return (
        <div className="trade-history-list">
            {displayTrades.map((trade, index) => {
                // Defensive checks for missing data
                if (!trade) return null;

                const entry = Number(trade.entryPrice) || 0;
                const exit = Number(trade.exitPrice) || 0;
                const bet = Number(trade.betAmount) || 0;
                const pnl = Number(trade.pnl) || 0;
                const ts = trade.timestamp || Date.now();

                const priceChange = entry > 0
                    ? ((exit - entry) / entry * 100).toFixed(2)
                    : '0.00';

                const isProfit = pnl >= 0;

                // Calculate display index (total - index)
                const tradeNum = tradeHistory.length - index;

                return (
                    <div key={index} style={{
                        background: isProfit ? 'rgba(59,255,176,0.05)' : 'rgba(255,75,106,0.05)',
                        border: `1px solid ${isProfit ? 'rgba(59,255,176,0.1)' : 'rgba(255,75,106,0.1)'}`,
                        borderRadius: 12,
                        padding: '12px',
                        marginBottom: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    fontSize: 11,
                                    background: 'rgba(255,255,255,0.1)',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    color: 'rgba(255,255,255,0.6)'
                                }}>
                                    #{tradeNum}
                                </span>
                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                                    {new Date(ts).toLocaleTimeString()}
                                </span>
                            </div>
                            <div style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: isProfit ? '#3bffb0' : '#ff6b81'
                            }}>
                                {isProfit ? '+' : ''}{pnl.toFixed(2)}
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr 1fr',
                            gap: 8,
                            fontSize: 11,
                            background: 'rgba(0,0,0,0.2)',
                            padding: '8px',
                            borderRadius: 6
                        }}>
                            <div>
                                <div style={{ color: 'rgba(255,255,255,0.4)' }}>Bet</div>
                                <div style={{ color: '#ffd700' }}>${bet.toFixed(0)}</div>
                            </div>
                            <div>
                                <div style={{ color: 'rgba(255,255,255,0.4)' }}>Entry</div>
                                <div style={{ color: '#fff' }}>{entry.toFixed(3)}</div>
                            </div>
                            <div>
                                <div style={{ color: 'rgba(255,255,255,0.4)' }}>Exit</div>
                                <div style={{ color: '#fff' }}>{exit ? exit.toFixed(3) : '-'}</div>
                            </div>
                            <div>
                                <div style={{ color: 'rgba(255,255,255,0.4)' }}>ROI</div>
                                <div style={{ color: isProfit ? '#3bffb0' : '#ff6b81', fontWeight: 600 }}>
                                    {bet > 0 ? ((pnl / bet) * 100).toFixed(0) : '0'}%
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
