import React, { useState, useEffect } from 'react';
import { soundManager } from '../game/SoundManager';

export default function AudioDebug() {
    const [status, setStatus] = useState('Unknown');

    useEffect(() => {
        const interval = setInterval(() => {
            if (soundManager.ctx) {
                setStatus(soundManager.ctx.state);
            } else {
                setStatus('Not Created');
            }
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const testOsc = () => {
        soundManager.resume();
        soundManager.playTone(600, 'square', 0.2, 1.0);
    };

    const testSpeech = () => {
        const u = new SpeechSynthesisUtterance("Audio Check One Two");
        window.speechSynthesis.speak(u);
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: 10,
            left: 10,
            background: 'rgba(0,0,0,0.9)',
            border: '1px solid lime',
            padding: 10,
            zIndex: 9999,
            color: 'lime',
            fontFamily: 'monospace',
            display: 'flex',
            flexDirection: 'column',
            gap: 5
        }}>
            <div style={{ fontWeight: 'bold' }}>🔊 AUDIO DEBUG</div>
            <div>Context Status: <span style={{ color: status === 'running' ? 'lime' : 'red' }}>{status}</span></div>

            <button onClick={() => soundManager.resume()} style={{ cursor: 'pointer', padding: 5, background: '#333', color: 'white' }}>
                Force Resume (Click Me)
            </button>

            <div style={{ display: 'flex', gap: 5 }}>
                <button onClick={testOsc} style={{ flex: 1, cursor: 'pointer', padding: 5, background: '#333', color: 'white' }}>
                    Test Beep
                </button>
                <button onClick={testSpeech} style={{ flex: 1, cursor: 'pointer', padding: 5, background: '#333', color: 'white' }}>
                    Test Speech
                </button>
            </div>
            <div style={{ fontSize: 10, opacity: 0.75 }}>
                MasterGain: {soundManager.masterGain ? soundManager.masterGain.gain.value : 'N/A'}
            </div>
        </div>
    );
}
