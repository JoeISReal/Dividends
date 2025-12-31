import { PublicKey } from '@solana/web3.js';

// Cache Storage
let _trendingCache = {
    data: null,
    lastUpdated: 0
};

let _priceCache = {
    data: null,
    lastUpdated: 0
};

// Constants
const CACHE_TTL_TRENDING = 10 * 60 * 1000; // 10 Minutes
const CACHE_TTL_PRICES = 2 * 60 * 1000;    // 2 Minutes

const JUP_PRICE_API_V3 = "https://api.jup.ag/price/v3/get";

// Config (Env or Default)
const DIVIDENDS_MINT = process.env.DIVIDENDS_MINT || "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";
const SOL_MINT = "So11111111111111111111111111111111111111112";

// Curated List of Top Tokens to Watch (Since Trending V2 is erratic)
const WATCHLIST = [
    { symbol: "SOL", mint: SOL_MINT },
    { symbol: "JUP", mint: "JUPyiwrYJFskUPiHa7hkeR8VUtkPHCLkdPwmZCvpvp" },
    { symbol: "BONK", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
    { symbol: "WIF", mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
    { symbol: "RAY", mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R" }
];

// Jupiter Tokens API V2
const JUP_TOKENS_V2_BASE = "https://api.jup.ag/tokens/v2";

/**
 * Fetch Top Trending/Organic Tokens via Jupiter V2
 * Uses 'toporganicscore' category
 */
export async function fetchTrendingTokens() {
    const now = Date.now();
    const API_KEY = process.env.JUPITER_API_KEY;

    if (_trendingCache.data && !_trendingCache.data.error && (now - _trendingCache.lastUpdated < CACHE_TTL_TRENDING)) {
        return _trendingCache.data;
    }

    try {
        console.log("[JupiterService] Fetching V2 trending tokens...");

        if (!API_KEY) {
            throw new Error("Missing JUPITER_API_KEY for V2 API");
        }

        // Fetch Top Organic Score tokens (last 24h)
        const url = `${JUP_TOKENS_V2_BASE}/toporganicscore/24h?limit=20`;
        const res = await fetch(url, {
            headers: { 'x-api-key': API_KEY }
        });

        if (!res.ok) throw new Error(`Jupiter V2 API failed: ${res.status}`);

        const tokens = await res.json();

        if (!Array.isArray(tokens)) {
            throw new Error("Invalid V2 API response format");
        }

        // Normalize for frontend
        const normalized = tokens.map(t => ({
            mint: t.id, // V2 uses 'id' for mint
            symbol: t.symbol,
            name: t.name,
            priceUsd: t.usdPrice, // Map usdPrice -> priceUsd for compatibility
            organicScore: t.organicScore,
            tags: t.tags || [],
            isVerified: t.isVerified,
            stats24h: t.stats24h
        }));

        const result = {
            source: "jupiter_v2_organic",
            updatedAt: now,
            tokens: normalized
        };

        _trendingCache = {
            data: result,
            lastUpdated: now
        };

        return result;

    } catch (e) {
        console.error("[JupiterService] Trending Error:", e.message);
        // Fallback or return error
        return { error: true, message: e.message, code: 500 };
    }
}

// Helper to batch fetch prices (Reuses existing logic patterns)
async function _getBatchPrices(mints) {
    if (!mints || mints.length === 0) return {};
    const API_KEY = process.env.JUPITER_API_KEY;
    const priceMap = {};

    // Try Jupiter V3 first (if Key)
    if (API_KEY) {
        try {
            // Jup V3 supports up to 100 ids
            const ids = mints.join(",");
            const url = `${JUP_PRICE_API_V3}?ids=${ids}`;
            const res = await fetch(url, { headers: { 'x-api-key': API_KEY } });
            if (res.ok) {
                const json = await res.json();
                const data = json.data || json; // Handle V3 schema
                mints.forEach(mint => {
                    const d = data[mint];
                    if (d) priceMap[mint] = d.price || d.usdPrice || 0;
                });
                return priceMap;
            }
        } catch (e) { console.error("[JupiterService] Batch Price JupV3 Error:", e.message); }
    }

    // Fallback: DexScreener (if Jup failed or no key)
    try {
        // DexScreener allows ~30 tokens per call. Check validity.
        // We'll just try the first 30 chars of mints str just in case, but let's do it properly.
        // DexScreener limit is length of URL mostly. 20 mints is fine.
        const ids = mints.join(",");
        const url = `https://api.dexscreener.com/latest/dex/tokens/${ids}`;
        const res = await fetch(url);
        if (res.ok) {
            const json = await res.json();
            const pairs = json.pairs || [];
            mints.forEach(mint => {
                // Find best pair for this mint
                const best = pairs.filter(p => p.baseToken.address === mint).sort((a, b) => b.liquidity.usd - a.liquidity.usd)[0];
                if (best) priceMap[mint] = best.priceUsd;
            });
        }
    } catch (e) { console.error("[JupiterService] Batch Price Dex Error:", e.message); }

    return priceMap;
}

/**
 * Fetch Prices for SOL and DIVIDENDS
 * Uses Jupiter V3 if Key is present, otherwise DexScreener
 */
export async function fetchTokenPrices() {
    const now = Date.now();

    if (_priceCache.data && (now - _priceCache.lastUpdated < CACHE_TTL_PRICES)) {
        return _priceCache.data;
    }

    const API_KEY = process.env.JUPITER_API_KEY;

    // Use Jupiter V3 if API Key is present
    if (API_KEY) {
        try {
            const ids = [SOL_MINT, DIVIDENDS_MINT].join(",");
            const url = `${JUP_PRICE_API_V3}?ids=${ids}`;

            console.log(`[JupiterService] Fetching prices via Jupiter V3`);
            const response = await fetch(url, { headers: { 'x-api-key': API_KEY } });

            if (response.ok) {
                const json = await response.json();
                const data = json.data || json;

                const getPrice = (mint) => {
                    const d = data[mint];
                    return d ? (d.price || d.usdPrice || "0") : "0";
                };

                const result = {
                    sol: { priceUsd: getPrice(SOL_MINT) },
                    dividends: { priceUsd: getPrice(DIVIDENDS_MINT) }
                };

                _priceCache = { data: result, lastUpdated: now };
                return result;
            } else {
                console.warn(`[JupiterService] Jup V3 failed (${response.status}), falling back to DexScreener`);
            }
        } catch (e) {
            console.error("[JupiterService] Jup V3 Error:", e.message);
        }
    }

    // Fallback: DexScreener
    try {
        const ids = [SOL_MINT, DIVIDENDS_MINT].join(",");
        const url = `https://api.dexscreener.com/latest/dex/tokens/${ids}`;

        console.log(`[JupiterService] Fetching prices via DexScreener: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            return { error: true };
        }

        const json = await response.json();
        const pairs = json.pairs || [];

        const getPrice = (mint) => {
            const bestPair = pairs
                .filter(p => p.baseToken.address === mint)
                .sort((a, b) => b.liquidity.usd - a.liquidity.usd)[0];
            return bestPair ? bestPair.priceUsd : "0";
        };

        const result = {
            sol: { priceUsd: getPrice(SOL_MINT) },
            dividends: { priceUsd: getPrice(DIVIDENDS_MINT) }
        };

        _priceCache = { data: result, lastUpdated: now };
        return result;

    } catch (e) {
        console.error("[JupiterService] Price Error:", e.message);
        return { error: true };
    }
}
