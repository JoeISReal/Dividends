import React, { useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { soundManager } from '../game/SoundManager';
import '../styles/dividends-theme.css';
import bs58 from 'bs58';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function LoginPage() {
    const login = useGameStore(s => s.login);
    const syncScore = useGameStore(s => s.syncScore);
    const [isConnecting, setIsConnecting] = useState(false);
    const [walletError, setWalletError] = useState(null);

    const connectPhantom = async () => {
        // Initialize sound on first interaction
        soundManager.resume();
        soundManager.playClick();

        setIsConnecting(true);
        setWalletError(null);

        try {
            const { solana } = window;
            if (solana && solana.isPhantom) {
                // 1. Connect
                const response = await solana.connect();
                soundManager.playSuccess(); // Wallet found
                const walletAddress = response.publicKey.toString();

                // 2. Get Challenge
                const chRes = await fetch(`${API_BASE}/api/auth/challenge?wallet=${walletAddress}`, {
                    credentials: "include"
                });
                if (!chRes.ok) {
                    const errText = await chRes.text().catch(() => 'No response body');
                    console.error("Challenge Request Failed:", {
                        status: chRes.status,
                        statusText: chRes.statusText,
                        url: chRes.url,
                        body: errText
                    });
                    throw new Error(`Failed to get challenge: ${chRes.status} ${chRes.statusText}`);
                }
                const ch = await chRes.json();


                // 3. Sign Message
                const encodedMessage = new TextEncoder().encode(ch.message);
                const signedMessage = await solana.signMessage(encodedMessage, "utf8");
                const signatureBase58 = bs58.encode(signedMessage.signature);

                // 4. Verify & Login
                const result = await login(walletAddress, ch.message, signatureBase58);

                if (result && result.success) {
                    soundManager.playSuccess(); // Login success
                    await syncScore();
                } else {
                    soundManager.playError();
                    setWalletError(`Login Failed: ${result?.error || 'Unknown error'}`);
                }
            } else {
                soundManager.playError();
                setWalletError("Phantom Wallet not found! Please install it. (window.solana is undefined)");
            }
        } catch (err) {
            console.error("Wallet connection failed", err);
            soundManager.playError();
            setWalletError(`Connection failed: ${err.message || err.toString()}`);
        }
        setIsConnecting(false);
    };

    return (
        <div className="bg-abstract-hero bg-overlay" style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
        }}>
            <div style={{
                background: 'rgba(26, 27, 35, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(171, 159, 242, 0.2)',
                borderRadius: 24,
                padding: 40,
                width: '100%',
                maxWidth: 420,
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
            }}>
                <div style={{
                    width: 80,
                    height: 80,
                    margin: '0 auto 24px',
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 0 20px rgba(171, 159, 242, 0.3)'
                }}>
                    <img src="/logo.png" alt="Dividends Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <h1 style={{
                    fontSize: 32,
                    fontWeight: 800,
                    marginBottom: 8,
                    background: 'linear-gradient(135deg, #fff 0%, #AB9FF2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    DIVIDENDS
                </h1>

                <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 15, lineHeight: 1.5 }}>
                    Build your empire. Trade the arena. <br />
                    Sign in with your wallet to begin.
                </p>

                <button
                    className="btn-primary"
                    style={{
                        width: '100%',
                        padding: '16px',
                        fontSize: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                        marginBottom: 16
                    }}
                    onClick={connectPhantom}
                    disabled={isConnecting}
                >
                    <span style={{ fontSize: 20 }}>👻</span>
                    {isConnecting ? 'Signing In...' : 'Connect Phantom'}
                </button>

                {walletError && (
                    <div style={{
                        color: '#ff4d4d',
                        fontSize: 13,
                        padding: 12,
                        background: 'rgba(255, 77, 77, 0.1)',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 77, 77, 0.2)'
                    }}>
                        {walletError}
                        {!window.solana && (
                            <a href="https://phantom.app/" target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 4, color: '#AB9FF2', textDecoration: 'underline' }}>
                                Install Phantom Wallet
                            </a>
                        )}
                    </div>
                )}

                <div style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>
                    Powered by Solana • Secure Auth
                </div>
            </div>
        </div>
    );
}
