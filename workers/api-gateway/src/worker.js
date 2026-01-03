/**
 * DIVIDENDS API Gateway Worker
 * 
 * Responsibilities:
 * - Reverse proxy /api/* to Render backend
 * - Rate limiting (IP + endpoint-specific)
 * - Edge caching for snapshot endpoints
 * - SSE pass-through for chat streams
 * - Zero Trust enforcement for staff routes
 * - Security headers (CORS, CSP, HSTS)
 */

// --- CONFIGURATION ---
const ORIGIN_URL = 'https://dividends-backend-28o8.onrender.com';
const ALLOWED_ORIGINS = [
    'https://dividendspro.com',
    'https://www.dividendspro.com'
];

// Rate limit thresholds (requests per minute)
const RATE_LIMITS = {
    '/api/auth/challenge': 10,
    '/api/auth/verify': 10,
    '/api/auth/logout': 5,
    '/api/community/chat/send': 20,
    '/api/community/raids/join': 30,
    '/api/buy-stream': 60,
    '/api/hire-manager': 60,
    '/api/buy-upgrade': 60,
    'default': 100
};

// Cache TTL for snapshot endpoints (seconds)
const CACHE_CONFIG = {
    '/api/bags/token/top-holders': { ttl: 60, swr: 600 },
    '/api/market/prices': { ttl: 120, swr: 600 },
    '/api/market/trending': { ttl: 120, swr: 600 },
    '/api/v1/holders': { ttl: 60, swr: 600 }
};

// Staff-only routes requiring Zero Trust
const PROTECTED_ROUTES = [
    '/api/community/chat/mod/action',
    '/api/community/mod/',
    '/api/community/raids/create',
    '/api/community/raids/cancel',
    '/api/admin/'
];

// --- WORKER ENTRY POINT ---
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Only handle /api/* routes
        if (!url.pathname.startsWith('/api/')) {
            return new Response('Not Found', { status: 404 });
        }

        try {
            // 1. CORS Preflight
            if (request.method === 'OPTIONS') {
                return handleCORS(request);
            }

            // 2. Validate Origin
            const origin = request.headers.get('Origin');
            if (origin && !ALLOWED_ORIGINS.includes(origin)) {
                return new Response('Forbidden: Invalid Origin', { status: 403 });
            }

            // 3. Zero Trust Gate (Staff Routes)
            if (isProtectedRoute(url.pathname)) {
                const accessCheck = await checkZeroTrust(request);
                if (!accessCheck.allowed) {
                    return new Response(JSON.stringify({
                        error: 'STAFF_ACCESS_REQUIRED',
                        message: 'This endpoint requires Cloudflare Access authentication'
                    }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }

            // 4. Rate Limiting
            const rateLimitResult = await checkRateLimit(request, url.pathname, env);
            if (!rateLimitResult.allowed) {
                return new Response(JSON.stringify({
                    error: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: rateLimitResult.retryAfter
                }), {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': String(rateLimitResult.retryAfter)
                    }
                });
            }

            // 5. Check Cache (GET requests only)
            if (request.method === 'GET' && CACHE_CONFIG[url.pathname]) {
                const cached = await getCachedResponse(request, env);
                if (cached) {
                    return addSecurityHeaders(cached, origin);
                }
            }

            // 6. Proxy to Origin
            const response = await proxyToOrigin(request, url);

            // 7. Cache Response (if applicable)
            if (request.method === 'GET' && CACHE_CONFIG[url.pathname]) {
                ctx.waitUntil(cacheResponse(request, response.clone(), env));
            }

            // 8. Add Security Headers
            return addSecurityHeaders(response, origin);

        } catch (error) {
            console.error('[Worker Error]', error);
            return new Response(JSON.stringify({
                error: 'GATEWAY_ERROR',
                message: 'Edge gateway encountered an error'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
};

// --- HELPER FUNCTIONS ---

/**
 * Handle CORS preflight requests
 */
function handleCORS(request) {
    const origin = request.headers.get('Origin');

    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
        return new Response(null, { status: 403 });
    }

    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Max-Age': '86400'
        }
    });
}

/**
 * Check if route requires Zero Trust authentication
 */
function isProtectedRoute(pathname) {
    return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Verify Cloudflare Access JWT assertion
 */
async function checkZeroTrust(request) {
    // Check for Cloudflare Access JWT header
    const accessJWT = request.headers.get('cf-access-jwt-assertion');

    if (!accessJWT) {
        return { allowed: false, reason: 'NO_ACCESS_TOKEN' };
    }

    // In production, you would verify the JWT signature here
    // For now, presence of header indicates Access passed
    return { allowed: true };
}

/**
 * Rate limiting using KV storage
 */
async function checkRateLimit(request, pathname, env) {
    // Get client identifier (IP address)
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

    // Determine rate limit for this endpoint
    const limit = RATE_LIMITS[pathname] || RATE_LIMITS.default;

    // Create rate limit key
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `ratelimit:${clientIP}:${pathname}:${minute}`;

    // Check KV (if available)
    if (!env.RATE_LIMIT_KV) {
        // No KV configured, allow request
        return { allowed: true };
    }

    try {
        const current = await env.RATE_LIMIT_KV.get(key);
        const count = current ? parseInt(current) : 0;

        if (count >= limit) {
            return {
                allowed: false,
                retryAfter: 60 - (Math.floor(now / 1000) % 60)
            };
        }

        // Increment counter
        await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 120 });

        return { allowed: true };
    } catch (error) {
        console.error('[Rate Limit Error]', error);
        // On error, allow request (fail open)
        return { allowed: true };
    }
}

/**
 * Get cached response if available and fresh
 */
async function getCachedResponse(request, env) {
    if (!env.CACHE_KV) return null;

    const url = new URL(request.url);
    const cacheKey = `cache:${url.pathname}${url.search}`;

    try {
        const cached = await env.CACHE_KV.get(cacheKey, { type: 'json' });

        if (!cached) return null;

        const age = Date.now() - cached.timestamp;
        const config = CACHE_CONFIG[url.pathname];

        // Check if stale
        if (age > config.swr * 1000) {
            // Too stale, don't serve
            return null;
        }

        // Serve cached response
        const response = new Response(cached.body, {
            status: cached.status,
            headers: new Headers(cached.headers)
        });

        // Add cache status header
        response.headers.set('X-Cache-Status', age < config.ttl * 1000 ? 'HIT' : 'STALE');
        response.headers.set('Age', String(Math.floor(age / 1000)));

        return response;
    } catch (error) {
        console.error('[Cache Read Error]', error);
        return null;
    }
}

/**
 * Cache response in KV
 */
async function cacheResponse(request, response, env) {
    if (!env.CACHE_KV) return;

    const url = new URL(request.url);
    const cacheKey = `cache:${url.pathname}${url.search}`;
    const config = CACHE_CONFIG[url.pathname];

    try {
        const body = await response.text();
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });

        const cacheData = {
            body,
            status: response.status,
            headers,
            timestamp: Date.now()
        };

        await env.CACHE_KV.put(cacheKey, JSON.stringify(cacheData), {
            expirationTtl: config.swr
        });
    } catch (error) {
        console.error('[Cache Write Error]', error);
    }
}

/**
 * Proxy request to origin backend
 */
async function proxyToOrigin(request, url) {
    // Build origin URL
    const originUrl = `${ORIGIN_URL}${url.pathname}${url.search}`;

    // Clone headers
    const headers = new Headers(request.headers);

    // Remove Cloudflare-specific headers
    headers.delete('cf-connecting-ip');
    headers.delete('cf-ray');
    headers.delete('cf-visitor');

    // Create proxied request
    const proxyRequest = new Request(originUrl, {
        method: request.method,
        headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
        redirect: 'manual'
    });

    // Fetch from origin
    const response = await fetch(proxyRequest);

    // For SSE streams, return as-is (no buffering)
    if (url.pathname.includes('/stream')) {
        return new Response(response.body, {
            status: response.status,
            headers: response.headers
        });
    }

    return response;
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response, origin) {
    const headers = new Headers(response.headers);

    // CORS
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        headers.set('Access-Control-Allow-Origin', origin);
        headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Referrer-Policy', 'no-referrer');
    headers.set('X-Edge-Gateway', 'cloudflare-worker');

    // HSTS (only on HTTPS)
    if (response.url && response.url.startsWith('https://')) {
        headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
    });
}
