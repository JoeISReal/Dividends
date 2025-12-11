// frontend/src/api.js
const BASE = 'http://localhost:3001/api';

async function safeFetch(url, opts) {
    try {
        const res = await fetch(url, opts);
        return res.ok ? await res.json() : { error: true, status: res.status, body: await res.text() };
    } catch (e) {
        return { error: true, message: e.message };
    }
}

export async function apiGetState() { return safeFetch(`${BASE}/state`); }
export async function apiBuyStream(playerId, streamId, amount) {
    return safeFetch(`${BASE}/buy-stream`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId, streamId, amount }) });
}
export async function apiBuyUpgrade(playerId, key) {
    return safeFetch(`${BASE}/buy-upgrade`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId, key }) });
}
export async function apiPrestige(playerId) {
    return safeFetch(`${BASE}/prestige`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId }) });
}
export async function apiOpenEvent(playerId) {
    return safeFetch(`${BASE}/open-event`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId }) });
}
