const BASE = 'http://localhost:3001/api';

export async function getState() {
    const res = await fetch(`${BASE}/state`);
    return res.json();
}

export async function saveState() {
    await fetch(`${BASE}/state/save`, { method: 'POST' });
}

export async function buyStream(streamId) {
    const res = await fetch(`${BASE}/buy-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId })
    });
    return res.json();
}

export async function buyUpgrade(upgradeId) {
    const res = await fetch(`${BASE}/buy-upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upgradeId })
    });
    return res.json();
}

export async function prestige() {
    const res = await fetch(`${BASE}/prestige`, { method: 'POST' });
    return res.json();
}

export async function checkEvent() {
    const res = await fetch(`${BASE}/events/random`);
    return res.json();
}
