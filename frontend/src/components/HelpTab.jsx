import React from 'react';

export default function HelpTab() {
    return (
        <div className="help-tab">
            <h2>Game Guide</h2>

            <div className="help-section">
                <h3>💰 Basics</h3>
                <p><strong>YPS (Yield Per Second):</strong> The amount of cash you earn automatically every second from your streams.</p>
                <p><strong>Click Yield:</strong> How much you earn each time you click the "FARM" button.</p>
            </div>

            <div className="help-section">
                <h3>🎰 Degen Arena</h3>
                <p><strong>What is it?</strong> A high-risk, high-reward trading simulator where you bet on volatile price movements.</p>

                <h4>How to Trade:</h4>
                <ol>
                    <li><strong>Select Multiplier:</strong> Choose 1x to 50x to scale your bet size</li>
                    <li><strong>Select Base Bet:</strong> Pick your base amount ($10-$500)</li>
                    <li><strong>BUY:</strong> Open a position at current price</li>
                    <li><strong>SELL:</strong> Close your position and realize profit/loss</li>
                </ol>

                <h4>Chart Features:</h4>
                <ul>
                    <li><strong>Blue Line:</strong> Current live price</li>
                    <li><strong>Yellow Line:</strong> Your entry price (breakeven point)</li>
                    <li><strong>P/L Display:</strong> Top-left shows your multiplier and profit/loss</li>
                    <li><strong>Candles:</strong> Green = price up, Red = price down</li>
                </ul>

                <h4>AI Trading Bots:</h4>
                <p>Four AI traders keep the market alive:</p>
                <ul>
                    <li><strong>WhaleGod:</strong> Large trades, slightly bullish</li>
                    <li><strong>DipBuyer:</strong> Aggressively buys dips</li>
                    <li><strong>RugPuller:</strong> Bearish trader causing dumps</li>
                    <li><strong>ScalpGoblin:</strong> Fast small trades</li>
                </ul>

                <h4>Market Moods:</h4>
                <ul>
                    <li><strong>Bleed:</strong> Slow downtrend</li>
                    <li><strong>Flat:</strong> Sideways choppy action</li>
                    <li><strong>Recover:</strong> Steady uptrend</li>
                    <li><strong>Pump:</strong> Explosive upward movement</li>
                    <li><strong>Rug:</strong> Dramatic crash</li>
                </ul>

                <h4>Market Stability (The "RUG" Meter):</h4>
                <p><strong>Stability 0-100%:</strong> Represents the health of the market.</p>
                <ul>
                    <li><strong>100%:</strong> Market is safe and healthy.</li>
                    <li><strong>Low Stability:</strong> High risk of a crash!</li>
                    <li><strong>0%:</strong> 💀 <strong>RUG PULL!</strong> The market crashes, trade closes instantly, and stability resets.</li>
                </ul>
                <p><em>Stability drops when prices dump rapidly and recovers slightly when prices pump.</em></p>

                <h4>Strategy Tips:</h4>
                <ul>
                    <li>Start with low multipliers (1x-2x) to learn</li>
                    <li>Watch for pumps - they don't last long</li>
                    <li>Sell into strength, buy into weakness</li>
                    <li>Higher multipliers = higher risk AND reward</li>
                    <li>The market has mean reversion - extreme prices tend to return to 1.0x</li>
                    <li><strong>Watch the Stability Meter!</strong> If it gets low, best to exit.</li>
                </ul>
            </div>

            <div className="help-section">
                <h3>📊 Streams</h3>
                <p>Streams are your income sources. Buy them to increase your YPS.</p>
                <ul>
                    <li><strong>Manual:</strong> You must click the stream card to produce cash.</li>
                    <li><strong>Automated:</strong> Hire a Manager to make the stream produce cash automatically!</li>
                </ul>
            </div>

            <div className="help-section">
                <h3>🎯 Milestones & Unlocks</h3>
                <p>Every stream has target numbers to reach (e.g., 25, 50, 100 owned).</p>
                <p><strong>Next Unlock:</strong> The bar at the bottom of each card shows your next goal.</p>
                <ul>
                    <li><strong>Profit Boosts (💰):</strong> Multiplies the stream's income (e.g., x2, x3).</li>
                    <li><strong>Speed Boosts (⚡):</strong> Halves the production time, making it run faster!</li>
                </ul>
            </div>

            <div className="help-section">
                <h3>👔 Managers</h3>
                <p>Managers automate your streams so they run while you're away or idle. They are essential for passive income!</p>
            </div>

            <div className="help-section">
                <h3>⚡ Upgrades</h3>
                <p>Buy upgrades to multiply your profits. Some apply to specific streams, while others boost your entire empire.</p>
            </div>

            <div className="help-section">
                <h3>👑 Prestige</h3>
                <p>Reset your progress to gain <strong>Shareholders</strong>. Each shareholder gives a % bonus to all future profits. Do this when progress slows down!</p>
            </div>
        </div>
    );
}
