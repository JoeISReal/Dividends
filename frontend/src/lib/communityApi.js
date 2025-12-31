
const API_BASE = import.meta.env.VITE_API_URL || '';

// Helper for standard fetch with auth
async function fetchWithAuth(endpoint, options = {}) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (e) {
        console.error(`API Error [${endpoint}]:`, e);
        throw e;
    }
}

export const communityApi = {
    // CHAT
    getRecentMessages: () => fetchWithAuth('/api/community/chat/recent'),
    sendMessage: (text) => fetchWithAuth('/api/community/chat/send', {
        method: 'POST',
        body: JSON.stringify({ text })
    }),
    modAction: (action, targetId, reason, duration) => fetchWithAuth('/api/community/chat/mod/action', {
        method: 'POST',
        body: JSON.stringify({ action, targetId, reason, duration })
    }),

    // RAIDS
    getActiveRaid: () => fetchWithAuth('/api/community/raids/active'),
    getRecentRaids: () => fetchWithAuth('/api/community/raids/recent'),
    createRaid: (payload) => fetchWithAuth('/api/community/raids/create', {
        method: 'POST',
        body: JSON.stringify(payload)
    }),
    trackRaid: (raidId, type) => fetchWithAuth('/api/community/raids/track', {
        method: 'POST',
        body: JSON.stringify({ raidId, type })
    }),
    cancelRaid: (raidId) => fetchWithAuth('/api/community/raids/cancel', {
        method: 'POST',
        body: JSON.stringify({ raidId })
    })
};
