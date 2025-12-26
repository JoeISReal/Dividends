
import React, { useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { soundManager } from '../game/SoundManager';

export default function PrestigeTab() {
    const multipliers = useGameStore(s => s.multipliers);
    const lifetimeYield = useGameStore(s => s.lifetimeYield);
    const doPrestige = useGameStore(s => s.doPrestige);
    const stats = useGameStore(s => s.stats);

    const [confirming, setConfirming] = useState(false);

    // Calc Next Multiplier (must match gameStore logic)
    // Formula: Sqrt(Lifetime / 1M)
    const rawMult = Math.sqrt(lifetimeYield / 1000000);
    const nextMult = Math.max(1.0, rawMult);

    // Improvement?
    const currentMult = multipliers.prestige || 1.0;
    const isUpgrade = nextMult > currentMult;
    const increase = nextMult - currentMult;

    // Progress to Next 1.0x (e.g. 1M, 4M, 9M, 16M)
    // Inverse: TargetYield = NextMult^2 * 1M
    // Example: Current 1.0. Target 2.0 -> 4M.
    const targetMultForDisplay = Math.floor(currentMult + 1);
    const targetYieldForDisplay = Math.pow(targetMultForDisplay, 2) * 1000000;
    const progressPercent = Math.min(100, (lifetimeYield / targetYieldForDisplay) * 100);
    const cashNeeded = Math.max(0, targetYieldForDisplay - lifetimeYield);

    // Only consider it an upgrade if it's visible (0.01 change)
    const isVisibleUpgrade = nextMult > (currentMult + 0.009);

    const handlePrestige = () => {
        if (!isVisibleUpgrade) return;

        if (!confirming) {
            soundManager.playClick();
            setConfirming(true);
            return;
        }

        soundManager.playLevelUp(); // Big sound
        doPrestige();
        setConfirming(false);
    };

    return (
        <div className="prestige-tab" style={{ padding: 'var(--space-4)', color: 'var(--text-primary)' }}>

            {/* HER0 HEADER */}
            <div className="surface-hud" style={{
                padding: 'var(--space-5)',
                marginBottom: 'var(--space-4)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                borderColor: 'var(--accent-gold)'
            }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>👑</div>
                    <h2 style={{ fontSize: 'var(--text-2xl)', color: 'var(--accent-gold)', marginBottom: '8px' }}>
                        PRESTIGE EMPIRE
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                        Reset your streams and cash to gain a permanent global multiplier.
                        Your Yield Per Second will be multiplied by this factor forever.
                    </p>
                </div>
            </div>

            {/* STATS GRID */}
            <div className="responsive-grid" style={{ marginBottom: 'var(--space-4)' }}>

                {/* CURRENT STATUS */}
                <div className="surface-hud surface-subordinate" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                    <div className="text-label" style={{ marginBottom: '8px' }}>CURRENT MULTIPLIER</div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        x{currentMult.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                        Active Boost
                    </div>
                </div>

                {/* LIFETIME STATS */}
                <div className="surface-hud surface-subordinate" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                    <div className="text-label" style={{ marginBottom: '8px' }}>LIFETIME EARNINGS</div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--accent-green)' }}>
                        ${Math.floor(lifetimeYield).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                        Determines Rank
                    </div>
                </div>

            </div>

            {/* PREDICTION SECTION */}
            <div className="surface-hud" style={{ padding: 'var(--space-5)', textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                <div className="text-label" style={{ marginBottom: '16px' }}>
                    {isVisibleUpgrade ? "UPON RESET YOU WILL RECEIVE" : "NEXT PRESTIGE MILESTONE"}
                </div>

                {isVisibleUpgrade ? (
                    <>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '20px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ fontSize: '24px', opacity: 0.5 }}>x{currentMult.toFixed(2)}</div>
                            <div>➜</div>
                            <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--accent-gold)' }}>
                                x{nextMult.toFixed(2)}
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(255,215,0,0.1)',
                            border: '1px solid var(--accent-gold)',
                            color: 'var(--accent-gold)',
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontWeight: 700
                        }}>
                            +{((increase / currentMult) * 100).toFixed(1)}% INCREASE
                        </div>
                    </>
                ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '16px', padding: '10px 0' }}>
                        Earn <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>${Math.ceil(cashNeeded).toLocaleString()}</span> more to unlock <strong>x{targetMultForDisplay.toFixed(2)}</strong>
                    </div>
                )}
            </div>

            {/* ACTION BUTTON */}
            <button
                className="btn-primary"
                disabled={!isVisibleUpgrade}
                onClick={handlePrestige}
                style={{
                    width: '100%',
                    padding: '20px',
                    fontSize: '18px',
                    backgroundColor: confirming ? '#ef4444' : (isVisibleUpgrade ? 'var(--accent-gold)' : 'var(--surface-subordinate)'),
                    color: confirming ? 'white' : (isVisibleUpgrade ? 'black' : 'var(--text-muted)'),
                    borderColor: confirming ? '#b91c1c' : 'transparent',
                    cursor: isVisibleUpgrade ? 'pointer' : 'not-allowed',
                    opacity: isVisibleUpgrade ? 1 : 0.5
                }}
            >
                {confirming ? "⚠️ CONFIRM WIPE ALL PROGRESS? ⚠️" : (isVisibleUpgrade ? "PRESTIGE RESET" : "NOT READY")}
            </button>

            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                Warning: Resets Cash, Streams, Managers, and Upgrades. <br />
                Does NOT reset Lifetime Stats or Achievements.
            </div>

        </div>
    );
}
