import React from 'react';

export default function TradeHistoryList({ tradeHistory, limit = 50 }) {
    if (!tradeHistory || tradeHistory.length === 0) {
        return (
            <div style={{
                background: 'var(--bg-panel-soft)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--text-secondary)'
            }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📈</div>
                <div style={{ fontSize: 'var(--text-sm)' }}>No trades yet</div>
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

                const isProfit = pnl >= 0;

                // Calculate display index (total - index)
                const tradeNum = tradeHistory.length - index;

                return (
                    <div key={index} style={{
                        background: isProfit ? 'rgba(59, 255, 176, 0.05)' : 'rgba(255, 75, 106, 0.05)',
                        border: `1px solid ${isProfit ? 'rgba(59, 255, 176, 0.1)' : 'rgba(255, 75, 106, 0.1)'}`,
                        borderRadius: 'var(--radius-md)',
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
                                    background: 'var(--bg-panel)',
                                    padding: '2px 6px',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--text-secondary)'
                                }}>
                                    #{tradeNum}
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    {new Date(ts).toLocaleTimeString()}
                                </span>
                            </div>
                            <div style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: isProfit ? 'var(--accent-green)' : 'var(--accent-red)'
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
                            borderRadius: 'var(--radius-sm)'
                        }}>
                            <div>
                                <div style={{ color: 'var(--text-muted)' }}>Bet</div>
                                <div style={{ color: 'var(--accent-gold)' }}>${bet.toFixed(0)}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)' }}>Entry</div>
                                <div style={{ color: 'var(--text-primary)' }}>{entry.toFixed(3)}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)' }}>Exit</div>
                                <div style={{ color: 'var(--text-primary)' }}>{exit ? exit.toFixed(3) : '-'}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)' }}>ROI</div>
                                <div style={{ color: isProfit ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
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
