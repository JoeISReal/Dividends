import React, { useState, useEffect } from "react";
import { Transaction } from "@solana/web3.js";
import { Buffer } from "buffer";
import { useGameStore } from "../state/gameStore";

// Buffer polyfill if needed
if (typeof window !== 'undefined' && !window.Buffer) {
    window.Buffer = Buffer;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function CapitalRecoveryPanel({ isOpen, onClose }) {
    const [step, setStep] = useState('SCAN'); // SCAN, CHOICES, CONFIRM_CONVERT, PROCESSING, RESULT
    const [data, setData] = useState({ totalSol: 0, count: 0, accounts: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [conversionConfirmed, setConversionConfirmed] = useState(false);

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setStep('SCAN');
            setData({ totalSol: 0, count: 0, accounts: [] });
            setError(null);
            setSuccessMsg(null);
            setConversionConfirmed(false);
        }
    }, [isOpen]);

    const scanRent = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/solana/scan-rent`, { credentials: 'include' });
            if (res.ok) {
                const result = await res.json();
                setData(result);
                // If accounts found, move to CHOICES, else stay on SCAN with "0 found" message
                if (result.totalSol > 0) {
                    setStep('CHOICES');
                }
            } else {
                setError("Scan failed. Connection error.");
            }
        } catch (e) {
            console.error("Scan error", e);
            setError("Scan failed. Network error.");
        } finally {
            setLoading(false);
        }
    };

    const handleReclaimWallet = async () => {
        await executeReclaim('wallet');
    };

    const handleReclaimConvert = async () => {
        setStep('CONFIRM_CONVERT');
    };

    const confirmConvertAndExecute = async () => {
        if (!conversionConfirmed) return;
        await executeReclaim('convert');
    };

    const executeReclaim = async (mode) => {
        if (!data.accounts.length) return;
        setLoading(true);
        setError(null);
        setStep('PROCESSING');

        try {
            const res = await fetch(`${API_BASE}/api/solana/create-reclaim-tx`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ accounts: data.accounts.map(a => a.pubkey) })
            });

            if (!res.ok) throw new Error("Failed to create transaction");

            const { transaction: base64Tx } = await res.json();

            // Deserialize
            const txBuffer = Buffer.from(base64Tx, 'base64');
            const transaction = Transaction.from(txBuffer);

            // Sign & Send
            const { solana } = window;
            if (solana && solana.isPhantom) {
                const { signature } = await solana.signAndSendTransaction(transaction);
                await solana.connection.confirmTransaction(signature, 'confirmed');

                setSuccessMsg(mode === 'convert'
                    ? `Reclaimed ${data.totalSol.toFixed(4)} SOL! (Conversion requires backend support - SOL sent to wallet)`
                    : `Reclaimed ${data.totalSol.toFixed(4)} SOL to wallet.`);
                setStep('RESULT');
            } else {
                throw new Error("Phantom wallet not connected");
            }
        } catch (e) {
            console.error("Reclaim error", e);
            setError(e.message || "Reclaim failed");
            setStep('RESULT');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div className="surface-primary" style={{
                width: '100%', maxWidth: '480px',
                padding: '24px', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column', gap: '20px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-muted)', paddingBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', letterSpacing: '1px' }}>RENT RECLAIM</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                </div>

                {/* STEP 1: SCAN */}
                {step === 'SCAN' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Scan your wallet for unused Token Accounts to reclaim rent (SOL).
                        </p>
                        <div style={{ marginBottom: '24px' }}>
                            {loading ? (
                                <div className="text-value">SCANNING...</div>
                            ) : (
                                data.totalSol > 0 ? (
                                    <div style={{ color: 'var(--accent-green)' }}>Found {data.totalSol.toFixed(4)} SOL</div>
                                ) : (
                                    <div style={{ opacity: 0.5 }}>Ready to Scan</div>
                                )
                            )}
                            {data.totalSol === 0 && !loading && <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>No reclaimable accounts found.</div>}
                        </div>

                        <button
                            className="btn-action-primary"
                            onClick={scanRent}
                            disabled={loading}
                            style={{ width: '100%' }}
                        >
                            {loading ? "SCANNING..." : "SCAN FOR RECLAIMABLE RENT"}
                        </button>
                    </div>
                )}

                {/* STEP 2: CHOICES */}
                {step === 'CHOICES' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                            <div className="text-value" style={{ fontSize: '24px', color: 'var(--text-primary)' }}>
                                {data.totalSol.toFixed(4)} SOL
                            </div>
                            <div className="text-label">RECLAIMABLE AMOUNT</div>
                        </div>

                        <button
                            className="btn-action-primary"
                            onClick={handleReclaimWallet}
                            style={{ justifyContent: 'center', padding: '16px' }}
                        >
                            RECLAIM TO WALLET
                        </button>

                        <button
                            className="surface-secondary"
                            onClick={handleReclaimConvert}
                            style={{
                                padding: '16px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'center', fontWeight: 600
                            }}
                        >
                            CONVERT TO DIVIDENDS
                        </button>

                        <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Conversion is optional. You can always reclaim to your wallet.
                        </div>
                    </div>
                )}

                {/* STEP 3: CONFIRM CONVERSION */}
                {step === 'CONFIRM_CONVERT' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ background: 'rgba(255,165,0,0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.2)' }}>
                            <div className="text-label" style={{ color: 'var(--accent-orange)', marginBottom: '8px' }}>ESTIMATED RECEIPT</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>DIVIDENDS (Approx)</span>
                                <span className="text-value">~{(data.totalSol * 1500).toFixed(0)} DVD</span>
                            </div>
                        </div>

                        <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={conversionConfirmed}
                                onChange={e => setConversionConfirmed(e.target.checked)}
                                style={{ marginTop: '4px' }}
                            />
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                I understand this converts SOL into DIVIDENDS.
                            </span>
                        </label>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                className="surface-secondary"
                                onClick={() => setStep('CHOICES')}
                                style={{ flex: 1, padding: '12px', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
                            >
                                BACK
                            </button>
                            <button
                                className="btn-action-primary"
                                disabled={!conversionConfirmed || loading}
                                onClick={confirmConvertAndExecute}
                                style={{ flex: 1 }}
                            >
                                CONFIRM CONVERSION
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: RESULT */}
                {(step === 'PROCESSING' || step === 'RESULT') && (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                                <div className="spinner" style={{ width: '30px', height: '30px', border: '2px solid var(--text-muted)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                <div>PROCESSING TRANSACTION...</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ fontSize: '16px', color: error ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                                    {error ? 'TRANSACTION FAILED' : 'RECLAIM SUCCESSFUL'}
                                </div>
                                {successMsg && <div style={{ color: 'var(--accent-green)' }}>{successMsg}</div>}
                                {error && <div style={{ color: 'var(--accent-red)', fontSize: '12px' }}>{error}</div>}

                                <button
                                    className="surface-secondary"
                                    onClick={onClose}
                                    style={{ padding: '12px', marginTop: '16px', cursor: 'pointer', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                                >
                                    CLOSE
                                </button>
                            </div>
                        )}
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                )}
            </div>
        </div>
    );
}

