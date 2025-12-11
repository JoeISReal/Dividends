class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.initialized = false;
        this.muted = false;
        this.volume = 0.2; // Track volume state
    }

    init() {
        // Intentionally empty. We init on first interaction.
    }

    // Call this on first user interaction (click) to unlock audio
    resume() {
        if (!this.ctx) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioContext();

                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = 0.2; // Default 20%
                this.masterGain.connect(this.ctx.destination);

                this.initialized = true;
                console.log("AudioContext Created & Resumed");
            } catch (e) {
                console.error("Web Audio API error", e);
            }
        }

        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => console.log("AudioContext Resumed"));
        }
    }

    playTone(freq, type, duration, vol = 1, slideTo = null) {
        this.resume();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            if (slideTo) {
                osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
            }

            // Simple Volume: No fancy ramps (hard cut is fine for retro feel)
            // Boosting volume significantly
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);

            console.log(`🎵 Playing ${type} at ${freq}Hz`);
        } catch (e) {
            console.error("Sound Error:", e);
        }
    }

    // --- SFX PRESETS ---

    playClick() {
        // High, short blip
        this.playTone(800, 'sine', 0.05, 0.5);
    }

    playHover() {
        // Very subtle tick
        this.playTone(400, 'sine', 0.02, 0.1);
    }

    playSuccess() {
        this.resume();
        if (!this.ctx) return;

        // Ascending major triad
        const now = this.ctx.currentTime;
        this.scheduleNote(523.25, 'triangle', now, 0.1); // C5
        this.scheduleNote(659.25, 'triangle', now + 0.1, 0.1); // E5
        this.scheduleNote(783.99, 'triangle', now + 0.2, 0.2); // G5
    }

    playError() {
        // Low buzzing descending
        this.playTone(150, 'sawtooth', 0.3, 0.5, 50);
    }

    playMoney() {
        // Coin sound (high ping with decay)
        this.resume();
        if (!this.initialized || this.muted || !this.ctx) return;

        const t = this.ctx.currentTime;

        // Specular layer (Sine)
        const osc1 = this.ctx.createOscillator();
        const g1 = this.ctx.createGain();
        osc1.frequency.setValueAtTime(1200, t);
        osc1.frequency.exponentialRampToValueAtTime(2000, t + 0.1);
        g1.gain.setValueAtTime(0.3, t);
        g1.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

        // Body layer (Square)
        const osc2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(1600, t);
        g2.gain.setValueAtTime(0.1, t);
        g2.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        osc1.connect(g1);
        osc2.connect(g2);
        g1.connect(this.masterGain);
        g2.connect(this.masterGain);

        osc1.start();
        osc2.start();
        osc1.stop(t + 0.6);
        osc2.stop(t + 0.6);
    }

    scheduleNote(freq, type, startTime, duration) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    setVolume(value) {
        // Clamp between 0 and 1
        const vol = Math.max(0, Math.min(1, value));
        this.volume = vol; // Save state

        if (this.masterGain) {
            this.masterGain.gain.value = vol;
        }
    }

    getVolume() {
        return this.volume;
    }
}

export const soundManager = new SoundManager();
