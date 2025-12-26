import React, { useEffect, useState } from 'react';

export default function MarketTab() {
    const [trending, setTrending] = useState(null);
    const [prices, setPrices] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(Date.now());

    const fetchData = async () => {
        setLoading(true);
        try {
            const [trendRes, priceRes] = await Promise.all([
                fetch('/api/market/trending'),
                fetch('/api/market/prices')
            ]);

            const trendData = await trendRes.json();
            const priceData = await priceRes.json();

            setTrending(trendData);
            setPrices(priceData);
            setLastUpdated(Date.now());
        } catch (e) {
            console.error("Market fetch failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Refresh every 60s
        return () => clearInterval(interval);
    }, []);

    const timeSince = (timestamp) => {
        const diff = Math.floor((Date.now() - timestamp) / 60000);
        return diff < 1 ? 'Just now' : `${diff} min ago`;
    };

    return (
        <div className="tab-content market-tab">
            <h2>📈 Market Pulse</h2>

            {/* Section 1: Core Prices */}
            <div className="market-prices-grid">
                <div className="price-card sol-card">
                    <div className="token-icon">SOL</div>
                    <div className="token-details">
                        <span className="label">Solana</span>
                        <span className="price">
                            {prices?.sol?.priceUsd && !prices.error ?
                                `$${parseFloat(prices.sol.priceUsd).toFixed(2)}` :
                                "---"
                            }
                        </span>
                    </div>
                </div>

                <div className="price-card div-card">
                    <div className="token-icon">DIV</div>
                    <div className="token-details">
                        <span className="label">Dividends</span>
                        <span className="price">
                            {prices?.dividends?.priceUsd && !prices.error ?
                                `$${parseFloat(prices.dividends.priceUsd).toFixed(6)}` :
                                "---"
                            }
                        </span>
                    </div>
                </div>
            </div>

            {/* Section 2: Trending */}
            <div className="trending-section">
                <h3>Trending on Solana (Jupiter)</h3>

                {loading && !trending ? (
                    <div className="loading-state">Scanning chain...</div>
                ) : (
                    <div className="trending-list">
                        {(trending?.error || !trending?.tokens || trending.tokens.length === 0) ? (
                            <div className="empty-state">
                                <p>Market quiet right now.</p>
                                <small>Or API rate limited</small>
                            </div>
                        ) : (
                            <table className="trending-table">
                                <thead>
                                    <tr>
                                        <th>Token</th>
                                        <th style={{ textAlign: 'center' }}>Score</th>
                                        <th>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trending.tokens.map((t, idx) => (
                                        <tr key={t.mint || idx}>
                                            <td className="col-token">
                                                <span className="rank-num">#{idx + 1}</span>
                                                <span className="sym">{t.symbol}</span>
                                                {t.isVerified && <span style={{ color: '#00dc82', marginLeft: 4 }} title="Verified">✓</span>}
                                            </td>
                                            <td className="col-score" style={{ textAlign: 'center', fontSize: '0.9em', opacity: 0.8 }}>
                                                {t.organicScore ? Math.round(t.organicScore) : '-'}
                                            </td>
                                            <td className="col-price">
                                                {t.priceUsd ? `$${parseFloat(t.priceUsd).toFixed(t.priceUsd < 1 ? 6 : 2)}` : "---"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            <div className="market-footer">
                <p>Market data provided by Jupiter / DexScreener</p>
                <p>Updated: {timeSince(lastUpdated)}</p>
                <button className="refresh-btn" onClick={fetchData}>Refresh</button>
            </div>

            <style jsx>{`
        .market-tab {
          padding: 20px;
          color: #e0e0e0;
        }
        .market-prices-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 30px;
        }
        .price-card {
          background: rgba(255, 255, 255, 0.05);
          padding: 15px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .sol-card { border-left: 4px solid #9945FF; }
        .div-card { border-left: 4px solid #14F195; }
        
        .token-icon {
          font-weight: bold;
          font-size: 0.9em;
          background: rgba(0,0,0,0.3);
          padding: 8px;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .token-details {
          display: flex;
          flex-direction: column;
        }
        .label { font-size: 0.8em; opacity: 0.7; }
        .price { font-size: 1.2em; font-weight: bold; }

        .trending-section {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 20px;
          min-height: 200px;
        }
        .trending-section h3 {
          margin-top: 0;
          font-size: 1.1em;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 10px;
          margin-bottom: 15px;
        }

        .trending-table {
          width: 100%;
          border-collapse: collapse;
        }
        .trending-table th {
          text-align: left;
          font-size: 0.8em;
          opacity: 0.5;
          padding-bottom: 10px;
        }
        .trending-table td {
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .rank-num {
          opacity: 0.5;
          margin-right: 10px;
          font-size: 0.9em;
          width: 20px;
          display: inline-block;
        }
        .sym { font-weight: bold; color: #fff; }
        .col-price { text-align: right; font-family: monospace; }
        
        .empty-state, .loading-state {
          text-align: center;
          padding: 40px;
          opacity: 0.6;
        }

        .market-footer {
          margin-top: 30px;
          text-align: center;
          font-size: 0.8em;
          opacity: 0.5;
        }
        .refresh-btn {
          margin-top: 10px;
          background: transparent;
          border: 1px solid #444;
          color: #aaa;
          padding: 5px 15px;
          border-radius: 4px;
          cursor: pointer;
        }
        .refresh-btn:hover { border-color: #888; color: #fff; }
      `}</style>
        </div>
    );
}
