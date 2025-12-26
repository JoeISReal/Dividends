
import React, { useState, useEffect } from "react";
import { Transaction } from "@solana/web3.js";
import { Buffer } from "buffer";
// Buffer polyfill might be needed in Vite? 
// Usually Vite handles buffer if configured or installed 'buffer'. 
// If 'buffer' is not defined global, we explicitly import it.
import { useGameStore } from "../state/gameStore";

// Ensure Buffer is available globally for web3.js if needed or just use import
if (typeof window !== 'undefined' && !window.Buffer) {
    window.Buffer = Buffer;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function CapitalRecoveryPanel() {
    const stability = useGameStore(s => s.arena?.stability ?? 100);
    const [data, setData] = useState({ totalSol: 0, count: 0, accounts: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    useEffect(() => {
        scanRent();
    }, []);

    const scanRent = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/solana/scan-rent`, { credentials: 'include' });
            if (res.ok) {
                const result = await res.json();
                setData(result);
            } else {
                // If 401, maybe not logged in? just ignore or show 0
                // console.warn("Rent scan failed", res.status);
            }
        } catch (e) {
            console.error("Scan error", e);
        } finally {
            setLoading(false);
        }
    };

    const handleReclaim = async () => {
        if (!data.accounts.length) return;
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            // 1. Get Tx from Backend
            const res = await fetch(`${API_BASE}/api/solana/create-reclaim-tx`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ accounts: data.accounts.map(a => a.pubkey) })
            });

            if (!res.ok) throw new Error("Failed to create transaction");

            const { transaction: base64Tx } = await res.json();

            // 2. Deserialize
            const txBuffer = Buffer.from(base64Tx, 'base64');
            const transaction = Transaction.from(txBuffer);

            // 3. Sign & Send (Phantom)
            const { solana } = window;
            if (solana && solana.isPhantom) {
                const { signature } = await solana.signAndSendTransaction(transaction);
                await solana.connection.confirmTransaction(signature, 'confirmed'); // Optional wait

                setSuccessMsg(`Reclaimed ${data.totalSol.toFixed(4)} SOL!`);
                scanRent(); // Refresh to clear list
            } else {
                throw new Error("Phantom wallet not connected");
            }
        } catch (e) {
            console.error("Reclaim error", e);
            setError(e.message || "Reclaim failed");
        } finally {
            setLoading(false);
        }
    };

    // Only show if there is rent to reclaim OR if we want to show the panel as a feature?
    // Logic: "Capital Recovery Panel" should probably always be visible to show STABILITY status?
    // User said: "Panel should display 'Recoverable Rent' ... Unclaimed rent from inactive infrastructure".
    // If 0, maybe hide?
    // User code earlier: `if (safeReclaimable <= 0) return null;`
    // Let's stick to that.
    // Force visible for user verification
    // if (!loading && (!data || data.totalSol <= 0)) return null;

    return (
        <section className="capital-recovery surface-secondary">
            <header className="capital-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>CAPITAL RECOVERY</h3>
                    <button
                        onClick={scanRent}
                        disabled={loading}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            opacity: loading ? 0.5 : 1
                        }}
                        title="Rescan Wallet"
                    >
                        {loading ? '↻' : '⟳'}
                    </button>
                </div>
                <span className="capital-subtext">
                    {loading ? "Scanning infrastructure..." : "Unclaimed rent from inactive infrastructure"}
                </span>
            </header>

            <div className="capital-body">
                <div className="capital-metric">
                    <span className="label">Recoverable Rent</span>
                    <span className="value" style={{
                        color: (!data || data.totalSol <= 0) ? 'var(--text-muted)' : 'var(--accent-gold)'
                    }}>
                        {loading ? "..." : (data.totalSol > 0 ? `${data.totalSol.toFixed(4)} SOL` : "0.0000 SOL")}
                    </span>
                    {(!loading && data.totalSol <= 0) && (
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            No empty accounts found.
                        </span>
                    )}
                </div>

                <div className="capital-actions">
                    <button
                        className="btn-action-economic"
                        disabled={stability < 30 || loading}
                        onClick={handleReclaim}
                    >
                        {loading ? "PROCESSING..." : "RECLAIM AS CASH"}
                        <span className="btn-hint">
                            {loading ? "Sign transaction..." : "Immediate liquidity · No yield exposure"}
                        </span>
                    </button>

                    <button
                        className="btn-action-primary"
                        disabled={true}
                        title="Coming Soon: Swap Integration"
                    >
                        CONVERT TO DIVIDENDS
                        <span className="btn-hint">
                            Reinvest capital · Yield exposure
                        </span>
                    </button>
                </div>
            </div>

            <footer className="capital-footer">
                {error ? <span style={{ color: 'var(--accent-red)' }}>{error}</span> :
                    successMsg ? <span style={{ color: 'var(--accent-green)' }}>{successMsg}</span> :
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span>This action closes empty token accounts. This cannot be reversed.</span>
                            {data?.debug && (
                                <span style={{ fontSize: '10px', opacity: 0.4, fontFamily: 'monospace' }}>
                                    DEBUG: Scanned {data.debug.scannedLegacy} (Legacy) + {data.debug.scanned2022} (2022)
                                </span>
                            )}
                        </div>
                }
            </footer>
        </section>
    );
}
