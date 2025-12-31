import React, { useState } from 'react';
import EcosystemOverview from './EcosystemOverview';
import CommunityGravity from './CommunityGravity';
import SystemAwareness from './SystemAwareness';
import UtilitiesGrid from './UtilitiesGrid';
import CapitalRecoveryPanel from './CapitalRecoveryPanel';
import { useSystemState } from '../hooks/useSystemState';
import { useMobile } from '../hooks/useMobile';

export default function DashboardTab() {
    const { risk } = useSystemState();
    const isMobile = useMobile();

    // UI State
    const [isRentReclaimOpen, setRentReclaimOpen] = useState(false);
    const [isGravityOpen, setGravityOpen] = useState(false); // For Mobile Modal

    return (
        <div className="dashboard-v2" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            height: '100%',
            overflow: 'hidden', // Container does not scroll, internal does
            paddingBottom: '24px'
        }}>

            {/* 1. Ecosystem Overview Strip (Always Visible) */}
            <EcosystemOverview />

            {/* 2. Main Grid */}
            <div className="dashboard-main-grid" style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 340px',
                gap: '16px',
                flex: 1,
                minHeight: 0,
                overflowY: isMobile ? 'auto' : 'hidden' // Mobile scrolls here, Desktop has column scroll
            }}>

                {/* ON MOBILE: System Awareness (Priority 2) comes before Community Gravity list */}
                {(isMobile) && (
                    <div style={{ order: 1 }}>
                        <SystemAwareness />
                    </div>
                )}

                {/* LEFT COLUMN (Desktop) / GRAVITY (Mobile Hidden/Modal) */}
                {(!isMobile) && (
                    <div style={{ minHeight: 0, overflow: 'hidden' }}>
                        <CommunityGravity />
                    </div>
                )}

                {/* SYSTEM AWARENESS (Desktop - Right Column) */}
                {(!isMobile) && (
                    <div style={{ overflowY: 'auto' }}>
                        <SystemAwareness />
                    </div>
                )}

                {/* ON MOBILE: Utilities + Gravity Button (Priority 4 & 5) */}
                {isMobile && (
                    <div style={{ order: 3, marginTop: '24px' }}>
                        <UtilitiesGrid
                            onOpenRentReclaim={() => setRentReclaimOpen(true)}
                            isMobile={isMobile}
                        />
                        {/* Mobile Gravity Button (Priority 5) */}
                        <button
                            className="surface-secondary"
                            onClick={() => setGravityOpen(true)}
                            style={{
                                width: '100%', padding: '16px', marginTop: '16px',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                                color: 'var(--text-primary)', fontWeight: 600
                            }}
                        >
                            <span>👥</span> VIEW COMMUNITY GRAVITY
                        </button>
                    </div>
                )}

            </div>

            {/* UTILITIES (Desktop - Bottom) */}
            {(!isMobile) && (
                <div style={{ marginTop: 'auto' }}>
                    <UtilitiesGrid onOpenRentReclaim={() => setRentReclaimOpen(true)} />
                </div>
            )}


            {/* MODALS */}
            <CapitalRecoveryPanel isOpen={isRentReclaimOpen} onClose={() => setRentReclaimOpen(false)} />

            {/* GRAVITY MODAL (Mobile Only) */}
            {isMobile && isGravityOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'var(--bg-root)', zIndex: 999,
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{
                        padding: '16px', borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'var(--bg-panel-dark)'
                    }}>
                        <span className="text-label" style={{ fontSize: '14px' }}>COMMUNITY GRAVITY</span>
                        <button onClick={() => setGravityOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', color: 'var(--text-primary)', padding: '0 8px' }}>&times;</button>
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <CommunityGravity />
                    </div>
                </div>
            )}

        </div>
    );
}
