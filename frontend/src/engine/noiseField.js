// src/engine/noiseField.js

// Simple deterministic PRNG (mulberry32)
function mulberry32(seed) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// A small "fractal" noise field built from multiple sine layers.
// Not "true Perlin", but gives smooth, coherent motion: waves within waves.
export class NoiseField {
    constructor(seed = 1337) {
        this.rng = mulberry32(seed);

        // Build 3–4 noise layers with different frequency / amplitude
        this.layers = [
            this.makeLayer(0.20, 0.035), // slow drift - 5x stronger
            this.makeLayer(0.8, 0.055), // medium trend - 5x stronger
            this.makeLayer(2.2, 0.075), // chop - 5x stronger
            this.makeLayer(5.0, 0.040), // fine noise - 5x stronger
        ];
    }

    makeLayer(freq, amp) {
        return {
            freq,
            amp,
            phase: this.rng() * Math.PI * 2,
        };
    }

    // t is in seconds
    sample(t) {
        let v = 0;
        for (const layer of this.layers) {
            v += layer.amp * Math.sin(layer.freq * t + layer.phase);
        }
        return v; // approximately in [-sum(amp), +sum(amp)]
    }
}
