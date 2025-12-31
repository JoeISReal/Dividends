import React from 'react';

export default function UtilitiesGrid({ onOpenRentReclaim, isMobile }) {

    // Shared Tile Style
    const tileStyle = (disabled) => ({
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px',
        borderRadius: 'var(--radius-md)',
        background: disabled ? 'var(--bg-panel-dark)' : 'var(--bg-panel-soft)',
        border: '1px solid var(--border-subtle)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.2s',
        minHeight: '100px'
    });

    return (
        <div>
            <div className="text-label" style={{ marginBottom: '12px', paddingLeft: '4px' }}>INFRASTRUCTURE UTILITIES</div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '16px'
            }}>

                {/* 1. Rent Reclaim (ACTIVE) */}
                <div
                    className="surface-secondary utility-tile"
                    style={tileStyle(false)}
                    onClick={onOpenRentReclaim}
                    onMouseEnter={e => !isMobile && (e.currentTarget.style.opacity = 0.9)}
                    onMouseLeave={e => !isMobile && (e.currentTarget.style.opacity = 1)}
                >
                    <div style={{ fontSize: '20px' }}>♻️</div>
                    <div>
                        <div className="text-value" style={{ fontSize: '14px' }}>RENT RECLAIM</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Scan & Recover SOL</div>
                    </div>
                </div>

                {/* 2. Swap (COMING SOON) - Hidden on Mobile */}
                {!isMobile && (
                    <div style={tileStyle(true)}>
                        <div style={{ fontSize: '20px', filter: 'grayscale(1)' }}>⇄</div>
                        <div>
                            <div className="text-value" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>SWAP</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>COMING SOON</div>
                        </div>
                    </div>
                )}

                {/* 3. Distributions (COMING SOON) - Hidden on Mobile */}
                {!isMobile && (
                    <div style={tileStyle(true)}>
                        <div style={{ fontSize: '20px', filter: 'grayscale(1)' }}>📦</div>
                        <div>
                            <div className="text-value" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>DISTRIBUTIONS</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>COMING SOON</div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
