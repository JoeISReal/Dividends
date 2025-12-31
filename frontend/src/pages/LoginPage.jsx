import React, { useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { soundManager } from '../game/SoundManager';
import '../styles/dividends-theme.css';
import '../styles/Login.css'; // Import the new styles
import bs58 from 'bs58';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function LoginPage() {
    const login = useGameStore(s => s.login);
    const syncScore = useGameStore(s => s.syncScore);
    const [loginPhase, setLoginPhase] = useState('idle'); // 'idle' | 'connecting' | 'success' 
    const [walletError, setWalletError] = useState(null);

    const connectPhantom = async () => {
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

                    // Delay final state update to show boot animation
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
                    }, 1500); // 1.5s delay for animation
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
    };

    return (
        <div className="login-page">
            {/* 1. Ambient Background Layer */}
            <div className="login-ambient-background" />
            <div className="login-grid-overlay" />

            {/* 2. HUD Overlay Layer */}
            <div className="login-hud login-hud-tl">
                <div>SYSTEM: STANDBY</div>
                <div>NET: SOLANA [MAINNET]</div>
            </div>
            <div className="login-hud login-hud-tr">
                <div>SECURE LINK</div>
                <div>V 0.9.2</div>
            </div>
            <div className="login-hud login-hud-bl">
                <div>EST. 2025</div>
            </div>
            <div className="login-hud login-hud-br">
                <div>DIVIDENDS CORP</div>
            </div>

            {/* 3. Boot Overlay (Preserved Transition) */}
            {loginPhase === 'success' && (
                <div className="boot-sequence-overlay">
                    <div className="boot-text">AUTHENTICATED</div>
                    <div className="boot-bar" />
                    <div className="boot-text" style={{ marginTop: 8, fontSize: 10, opacity: 0.7 }}>INITIALIZING SESSION...</div>
                </div>
            )}

            {/* 4. Main Login Card */}
            <div className="login-card-container">
                <div className="login-card-content">
                    <div className="login-logo-wrapper">
                        <img src="/logo.png" alt="Dividends Logo" className="login-logo-img" />
                    </div>

                    <div className="login-status-pill">
                        <div className="status-dot"></div>
                        <span>Reclaim Protocol Active</span>
                    </div>

                    <h1 className="login-title">
                        DIVIDENDS
                    </h1>

                    <p className="login-subtitle">
                        The arena awaits.<br />Connect your wallet to resume operations.
                    </p>

                    <button
                        className="login-connect-btn"
                        onClick={connectPhantom}
                        disabled={loginPhase !== 'idle'}
                    >
                        {loginPhase === 'connecting' ? (
                            <>
                                <span className="btn-icon-phantom">⏳</span>
                                <span>Verifying...</span>
                            </>
                        ) : (
                            <>
                                <span className="btn-icon-phantom">👻</span>
                                <span>Connect Phantom</span>
                            </>
                        )}
                    </button>

                    {walletError && (
                        <div className="login-error-box">
                            {walletError}
                            {!window.solana && (
                                <a href="https://phantom.app/" target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 8, color: '#fff', textDecoration: 'underline' }}>
                                    Install Phantom Wallet
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
