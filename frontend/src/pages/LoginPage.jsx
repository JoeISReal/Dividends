import React, { useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { soundManager } from '../game/SoundManager';
import '../styles/dividends-theme.css';
import bs58 from 'bs58';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function LoginPage() {
    const login = useGameStore(s => s.login);
    const syncScore = useGameStore(s => s.syncScore);
    const [loginPhase, setLoginPhase] = useState('idle'); // 'idle' | 'connecting' | 'success' 
    const [walletError, setWalletError] = useState(null);

    const connectPhantom = async () => {
        // Initialize sound on first interaction
        // Initialize sound on first interaction
        try {
            soundManager.resume();
            soundManager.playClick();
        } catch (e) {
            console.warn("Sound manager failed", e);
        }

        setLoginPhase('connecting');
        setWalletError(null);

        try {
            const { solana } = window;
            if (solana && solana.isPhantom) {
                // 1. Connect
                const response = await solana.connect();
                soundManager.playSuccess(); // Wallet found
                const walletAddress = response.publicKey.toString();

                // 2. Get Challenge
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

                // 4. Verify (Backend)
                // Manual Verify
                const verifyRes = await fetch(`${API_BASE}/api/auth/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ wallet: walletAddress, message: ch.message, signature: signatureBase58 })
                });

                let success = false;
                let errorMsg = "Verify failed";

                let userData = null;

                if (verifyRes.ok) {
                    const vData = await verifyRes.json();
                    if (vData.ok) {
                        success = true;
                        userData = vData.user;
                    } else {
                        errorMsg = vData.error || "Unknown error";
                    }
                } else {
                    console.error("Verify failed status:", verifyRes.status);
                    errorMsg = `Server error ${verifyRes.status}`;
                }

                if (success && userData) {
                    soundManager.playSuccess();
                    setLoginPhase('success');

                    // Delay final state update
                    setTimeout(async () => {
                        try {
                            // Direct State Hydration (No second fetch)
                            useGameStore.getState().hydrateAndLogin(userData);

                            // Sync Score (safe to call, updates leaderboard)
                            await syncScore();
                        } catch (e) {
                            console.error("Final login state update failed:", e);
                            setWalletError("Login State Update Failed");
                            setLoginPhase('idle');
                        }
                    }, 800);
                } else {
                    soundManager.playError();
                    setWalletError(`Login Failed: ${errorMsg}`);
                    setLoginPhase('idle');
                }
            } else {
                console.warn("Phantom wallet not found");
                soundManager.playError();
                setWalletError("Phantom Wallet not found! Please install it.");
                setLoginPhase('idle');
            }
        } catch (err) {
            console.error("Wallet connection exception:", err);
            soundManager.playError();
            setWalletError(`Connection failed: ${err.message || err.toString()}`);
            setLoginPhase('idle');
        }
        // Connection attempt finished (unless success)
    };

    return (
        <div className="bg-abstract-hero bg-overlay" style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* 1. Ambient Background Layer */}
            <div className="ambient-grid" />

            {/* 2. HUD Overlay Layer */}
            <div className="hud-overlay">
                <div className="hud-top-left">
                    <div>SYSTEM: STANDBY</div>
                    <div>NET: SOLANA</div>
                </div>
                <div className="hud-btm-right">
                    <div>SECURE LINK</div>
                    <div>V 0.9.1 BETA</div>
                </div>
            </div>

            {/* 3. Boot Overlay (Preserved Transition) */}
            {loginPhase === 'success' && (
                <div className="boot-overlay">
                    <div style={{ marginBottom: 16, fontSize: 32 }}>🚀</div>
                    Entering Arena...
                </div>
            )}

            {/* 4. Main Login Card */}
            <div className={`login-card ${loginPhase === 'success' ? 'success' : ''}`} style={{
                background: 'rgba(20, 20, 24, 0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 24,
                padding: '48px 40px',
                width: '100%',
                maxWidth: 440,
                textAlign: 'center',
                boxShadow: '0 30px 80px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.05)',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{
                    width: 72,
                    height: 72,
                    margin: '0 auto 24px',
                    borderRadius: 18,
                    overflow: 'hidden',
                    boxShadow: '0 0 30px rgba(171, 159, 242, 0.15)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <img src="/logo.png" alt="Dividends Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <h1 style={{
                    fontSize: 28,
                    fontWeight: 800,
                    marginBottom: 8,
                    letterSpacing: '-0.02em',
                    color: '#fff'
                }}>
                    DIVIDENDS
                </h1>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 32,
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                }}>
                    <span style={{ width: 6, height: 6, background: '#3bffb0', borderRadius: '50%', boxShadow: '0 0 8px #3bffb0' }}></span>
                    System Online
                </div>

                <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 15, lineHeight: 1.6 }}>
                    Welcome to the arena.<br />Connect your wallet to resume operations.
                </p>

                <button
                    className={`btn-action-primary ${loginPhase === 'connecting' ? 'btn-pulse' : ''}`}
                    style={{
                        width: '100%',
                        padding: '16px',
                        fontSize: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                        marginBottom: 20,
                        opacity: loginPhase === 'connecting' ? 0.9 : 1,
                        cursor: loginPhase === 'connecting' ? 'wait' : 'pointer',
                        background: 'linear-gradient(135deg, #fff 0%, #e0e0e0 100%)',
                        color: '#000',
                        border: 'none',
                        boxShadow: '0 4px 20px rgba(255,255,255,0.15)',
                        transition: 'transform 0.1s, box-shadow 0.1s'
                    }}
                    onClick={connectPhantom}
                    disabled={loginPhase !== 'idle'}
                >
                    <span style={{ fontSize: 20 }}>👻</span>
                    {loginPhase === 'connecting' ? 'Verifying Signature...' : 'Connect Phantom'}
                </button>

                {walletError && (
                    <div style={{
                        color: '#ff4d4d',
                        fontSize: 13,
                        padding: 12,
                        background: 'rgba(255, 77, 77, 0.08)',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 77, 77, 0.15)',
                        marginBottom: 16
                    }}>
                        {walletError}
                        {!window.solana && (
                            <a href="https://phantom.app/" target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 4, color: '#fff', textDecoration: 'underline' }}>
                                Install Phantom Wallet
                            </a>
                        )}
                    </div>
                )}

                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>
                    SECURE AUTHENTICATION • SOLANA NETWORK
                </div>
            </div>
        </div>
    );

}
