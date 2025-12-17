
// Phase 4: Resilient HTTP Wrapper
// Handles retries, timeouts, and auth failures.

const BASE_URL = import.meta.env.VITE_API_URL || '';
const DEFAULT_TIMEOUT = 6000;
const MAX_RETRIES = 3;

/**
 * Robust fetch wrapper with automatic backoff
 * @param {string} endpoint - Relative path (e.g. /api/bags/status)
 * @param {object} options - Fetch options
 * @param {number} attempts - Current retry count (internal)
 */
export async function resilientFetch(endpoint, options = {}, attempts = 0) {
    const url = `${BASE_URL}${endpoint}`;

    // 1. Timeout Logic (AbortController)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    const config = {
        ...options,
        credentials: 'include', // Always include cookies
        signal: controller.signal,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    };

    try {
        const res = await fetch(url, config);
        clearTimeout(timeoutId);

        // 2. Auth Guard (401) - Do NOT retry, trigger logout flow in app (handled by store usually)
        if (res.status === 401) {
            // Signal to caller that auth failed
            const err = new Error("Session Expired");
            err.status = 401;
            throw err;
        }

        // 3. Server Errors (5xx) or Rate Limits (429) - RETRY
        if ((res.status >= 500 || res.status === 429) && attempts < MAX_RETRIES) {
            const backoff = Math.pow(2, attempts) * 400 + Math.random() * 100; // Exponential jitter
            console.warn(`[Client] Req failed (${res.status}). Retrying in ${Math.floor(backoff)}ms...`);
            await new Promise(r => setTimeout(r, backoff));
            return resilientFetch(endpoint, options, attempts + 1);
        }

        // 4. Client Errors (400-499) - Do NOT retry
        if (!res.ok) {
            // Parse error if JSON
            let errMsg = res.statusText;
            try {
                const errData = await res.json();
                errMsg = errData.error || errMsg;
            } catch (e) { }
            const err = new Error(errMsg);
            err.status = res.status;
            throw err;
        }

        // Success
        return res; // Caller calls .json()

    } catch (e) {
        clearTimeout(timeoutId);

        // Network Errors / Timeout - RETRY
        if ((e.name === 'AbortError' || e.message === 'Failed to fetch') && attempts < MAX_RETRIES) {
            const backoff = Math.pow(2, attempts) * 400 + Math.random() * 100;
            console.warn(`[Client] Network error (${e.message}). Retrying in ${Math.floor(backoff)}ms...`);
            await new Promise(r => setTimeout(r, backoff));
            return resilientFetch(endpoint, options, attempts + 1);
        }

        throw e; // Give up
    }
}
