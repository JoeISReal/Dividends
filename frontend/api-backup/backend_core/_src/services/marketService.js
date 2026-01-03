
// Service to fetch Real Market Data (DexScreener)
import fetch from 'node-fetch';

const DEX_API_BASE = 'https://api.dexscreener.com/latest/dex/tokens';

export async function fetchTokenData(mint) {
    if (!mint) return null;

    try {
        const res = await fetch(`${DEX_API_BASE}/${mint}`);
        if (!res.ok) {
            console.error(`[MarketService] DexScreener API Error: ${res.status}`);
            return null;
        }

        const data = await res.json();
        if (!data.pairs || data.pairs.length === 0) {
            console.warn(`[MarketService] No pairs found for mint: ${mint}`);
            return null;
        }

        // DexScreener returns multiple pairs. We usually want the most liquid one.
        // They are often sorted by liquidity/volume, but let's be safe and sort by liquidity.
        const bestPair = data.pairs.sort((a, b) => b.liquidity?.usd - a.liquidity?.usd)[0];

        return {
            price: parseFloat(bestPair.priceUsd) || 0,
            volume24h: bestPair.volume?.h24 || 0,
            liquidity: bestPair.liquidity?.usd || 0,
            priceChange24h: bestPair.priceChange?.h24 || 0,
            dexId: bestPair.dexId,
            url: bestPair.url
        };
    } catch (e) {
        console.error("[MarketService] Exception:", e.message);
        return null;
    }
}
