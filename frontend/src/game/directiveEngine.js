// frontend/src/game/directiveEngine.js
// Centralized “Directive System” evaluator.
// Emits authoritative system directives (not flavor text).

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const now = () => Date.now();

const DEFAULTS = {
    maxSignals: 10,
    velocityWindowMs: 30_000,
    velocityMinDeltaPct: 10,     // only speak if >= |10%|
    activityWindowMs: 8_000,     // “recent activity” definition
    cooldownMs: 10_000,          // per-directive cooldown
};

export class DirectiveEngine {
    constructor(opts = {}) {
        this.cfg = { ...DEFAULTS, ...opts };
        this._last = new Map();          // key -> lastEmittedAt
        this._ypsHistory = [];           // [{ t, yps }]
        this._prevBands = {
            risk: null,
            automationGap: null,
        };
    }

    _cooldownOk(key, cooldownMs = this.cfg.cooldownMs) {
        const t = now();
        const last = this._last.get(key) || 0;
        if (t - last < cooldownMs) return false;
        this._last.set(key, t);
        return true;
    }

    _pushYps(yps) {
        const t = now();
        this._ypsHistory.push({ t, yps: Number(yps) || 0 });

        const cutoff = t - this.cfg.velocityWindowMs;
        while (this._ypsHistory.length && this._ypsHistory[0].t < cutoff) {
            this._ypsHistory.shift();
        }
    }

    _velocityPct() {
        if (this._ypsHistory.length < 2) return 0;
        const first = this._ypsHistory[0].yps;
        const last = this._ypsHistory[this._ypsHistory.length - 1].yps;
        if (first <= 0) return 0; // don’t invent % when baseline is 0
        return ((last - first) / first) * 100;
    }

    _riskBand(stability) {
        const s = clamp(Number(stability) || 0, 0, 100);
        if (s < 35) return "CRITICAL";
        if (s < 70) return "ELEVATED";
        return "LOW";
    }

    _emit(type, title, detail) {
        return {
            id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
            type,               // 'info' | 'warning' | 'success' | 'critical'
            message: title,     // Line 1
            detail,             // Line 2
            timestamp: Date.now(),
            source: "directive",
        };
    }

    // Main evaluation. Pass the Zustand state snapshot (get()).
    // Returns: array of signals to append.
    check(state) {
        const out = [];

        // Inputs (derived)
        const yps = Number(state?.yps) || 0;
        const stability = state?.arena?.stability ?? 100;

        const streams = Array.isArray(state?.streams) ? state.streams : [];
        // If streams is an object map (legacy), convert values
        // But checking gameStore.js, streams is an object: Object.fromEntries(...)
        // So we need to handle that.

        // ADJUSTMENT FOR GAMESTORE SCHEMA
        let streamsList = [];
        if (state?.streams && typeof state.streams === 'object' && !Array.isArray(state.streams)) {
            streamsList = Object.values(state.streams);
        } else if (Array.isArray(state?.streams)) {
            streamsList = state.streams;
        }

        const totalStreams = streamsList.length;

        // Managers is also an object map: { key: boolean, ... } or { key: { h: true } }?
        // In gameStore.js: managers: Object.fromEntries(STREAMS.map(s => [s.id, false]))
        // So it's just a boolean map.
        const managersMap = state?.managers || {};
        // "Active manager" = value is true
        const activeManagers = Object.values(managersMap).filter(val => val === true).length;
        // Wait, let's verify if `streams` objects have `hasManager` prop. 
        // In gameStore `hireManager`: streams[key].hasManager = true.
        // So we can count from streams too if we want.
        // But strict count from managers map is safer if consistent.
        // The user code used: 
        // const activeManagers = managers.filter(m => (m?.owned ?? m?.hired ?? m?.active ?? false) === true).length;
        // That assumes managers is an array of objects.
        // Since our store uses an object map for managers, I need to adapt the extraction logic slightly to match existing store schema.

        // RE-ADAPTING LOGIC FOR OBJECT MAPS
        // totalStreams is fine (Object.values(state.streams).length ideally, but wait... 
        // `state.streams` is map of { level, baseCost... }.
        // If we only count PURCHASED streams (level > 0)? 
        // "Unmanaged streams > 0". Usually implies streams we own that don't have managers.
        // If level 0, do we care? probably not.
        // Let's assume we care about streams with level > 0.

        const ownedStreams = streamsList.filter(s => s.level > 0);
        const ownedStreamCount = ownedStreams.length;

        // Count how many of these owned streams have managers.
        const managedOwnedStreams = ownedStreams.filter(s => s.hasManager).length;

        const automationGap = ownedStreamCount > 0 ? Math.max(0, ownedStreamCount - managedOwnedStreams) : 0;
        // User logic was: totalStreams - activeManagers. 
        // If user buys 0 streams, gap is 0.
        // If user buys 1 stream (level 1) and no manager, gap is 1. Match.

        const fatigue = Number(state?.fatigue) || 0;

        const signals = Array.isArray(state?.signals) ? state.signals : [];
        const recentActivity = signals.some(s => (Date.now() - (s?.timestamp || 0)) < this.cfg.activityWindowMs);

        // Track history
        this._pushYps(yps);

        // ---------------------------
        // Directive: Automation
        // ---------------------------
        if (ownedStreamCount > 0) {
            const gapBand = automationGap > 0 ? "GAP" : "MANAGED";

            // Only emit when band changes OR cooldown allows periodic reminder.
            const bandChanged = this._prevBands.automationGap !== gapBand;
            this._prevBands.automationGap = gapBand;

            if (gapBand === "GAP") {
                if ((bandChanged || this._cooldownOk("automation_gap", 15_000))) {
                    out.push(
                        this._emit(
                            "warning",
                            "Automation gap detected",
                            `${automationGap}/${ownedStreamCount} streams unmanaged.`
                        )
                    );
                }
            } else {
                if (bandChanged && this._cooldownOk("automation_online", 8_000)) {
                    out.push(
                        this._emit(
                            "success",
                            "Automation online",
                            `All ${ownedStreamCount} streams managed.`
                        )
                    );
                }
            }
        }

        // ---------------------------
        // Directive: Risk pressure (stability bands)
        // ---------------------------
        const riskBand = this._riskBand(stability);
        const riskChanged = this._prevBands.risk !== riskBand;
        const prevRisk = this._prevBands.risk;
        this._prevBands.risk = riskBand;

        if (riskBand === "CRITICAL") {
            if (riskChanged || this._cooldownOk("risk_critical", 8_000)) {
                out.push(
                    this._emit(
                        "critical",
                        "Critical instability",
                        `Stability at ${Math.round(stability)}%. Reduce exposure.`
                    )
                );
            }
        } else if (riskBand === "ELEVATED") {
            if (riskChanged || this._cooldownOk("risk_elevated", 12_000)) {
                out.push(
                    this._emit(
                        "warning",
                        "Risk pressure elevated",
                        `Stability at ${Math.round(stability)}%. Expect volatility.`
                    )
                );
            }
        } else if (riskBand === "LOW") {
            // Only emit “stabilized” when recovering from elevated/critical
            if ((prevRisk === "ELEVATED" || prevRisk === "CRITICAL") && this._cooldownOk("risk_stabilized", 10_000)) {
                out.push(
                    this._emit(
                        "info",
                        "System stabilized",
                        `Stability recovered to ${Math.round(stability)}%.`
                    )
                );
            }
        }

        // ---------------------------
        // Directive: Fatigue
        // ---------------------------
        if (fatigue >= 65) {
            if (this._cooldownOk("fatigue_high", 20_000)) {
                out.push(
                    this._emit(
                        "warning",
                        "Operator fatigue rising",
                        `Efficiency degraded. Consider downtime or upgrades.`
                    )
                );
            }
        }

        // ---------------------------
        // Directive: Yield velocity (30s % change)
        // ---------------------------
        const vPct = this._velocityPct();
        const abs = Math.abs(vPct);
        if (abs >= this.cfg.velocityMinDeltaPct) {
            if (vPct > 0) {
                if (this._cooldownOk("yield_velocity_up", 15_000)) {
                    out.push(
                        this._emit(
                            "success",
                            "Yield velocity rising",
                            `+${vPct.toFixed(0)}% / 30s. Momentum building.`
                        )
                    );
                }
            } else {
                if (this._cooldownOk("yield_velocity_down", 15_000)) {
                    out.push(
                        this._emit(
                            "warning",
                            "Yield velocity decelerating",
                            `${vPct.toFixed(0)}% / 30s. Consider reinvestment.`
                        )
                    );
                }
            }
        }

        // ---------------------------
        // Optional: Activity ping (only if you want it)
        // ---------------------------
        if (recentActivity && this._cooldownOk("activity_ping", 12_000)) {
            out.push(this._emit("info", "System active", "Recent operations detected."));
        }

        return out;
    }

    // Convenience for trimming signals array.
    trim(signals) {
        const max = this.cfg.maxSignals;
        if (!Array.isArray(signals)) return [];
        return signals.slice(-max);
    }
}

// Singleton instance (recommended)
export const directiveEngine = new DirectiveEngine();
