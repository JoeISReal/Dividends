
import React, { useState } from 'react';
import { ChatPanel } from '../components/community/ChatPanel';
import { RaidOpsPanel } from '../components/community/RaidOpsPanel';
import { useGameStore } from '../state/gameStore';
import { useSystemState } from '../hooks/useSystemState'; // New import
import '../styles/community.css';

export default function CommunityOps() {
    const { risk } = useSystemState();
    const [mobileTab, setMobileTab] = useState('LIVE'); // LIVE | RAID
    const auth = useGameStore(s => s.auth);

    const userRole = auth.user?.role || 'USER';
    const isAdmin = userRole === 'ADMIN';
    const isMod = userRole === 'MOD';

    // Dynamic border for high risk states
    const pageStyle = risk.status === 'CRITICAL' || risk.status === 'ELEVATED'
        ? { boxShadow: `inset 0 0 20px ${risk.color}20`, border: `1px solid ${risk.color}40` }
        : {};

    return (
        <div className="community-ops-page" style={pageStyle}>
            {/* Header */}
            <header className="comm-header">
                <div className="comm-header-main">
                    <h1 className="comm-title">COMMUNITY OPERATIONS</h1>
                    <span className="comm-status-dot pulse-slow" style={{ background: risk.color, boxShadow: `0 0 8px ${risk.color}` }}></span>

                    {/* Role Pills */}
                    {(isAdmin || isMod) && (
                        <div className="role-pills-container">
                            <div className="role-pill pill-system">
                                <span>SYSTEM</span>
                            </div>
                            {isAdmin && (
                                <div className="role-pill pill-admin">
                                    <span>ADMIN</span>
                                </div>
                            )}
                            {isMod && (
                                <div className="role-pill pill-mod">
                                    <span>MODERATOR</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="comm-subline">Coordinated actions. Audited messages.</div>
            </header>

            {/* Mobile Tabs */}
            <div className="comm-mobile-tabs">
                <button
                    className={`comm-tab ${mobileTab === 'LIVE' ? 'active' : ''}`}
                    onClick={() => setMobileTab('LIVE')}
                >
                    OPERATOR CHANNEL
                </button>
                <button
                    className={`comm-tab ${mobileTab === 'RAID' ? 'active' : ''}`}
                    onClick={() => setMobileTab('RAID')}
                >
                    MISSION CONTROL
                </button>
            </div>

            {/* Main Grid */}
            <div className="comm-grid">
                {/* Left: Chat */}
                <section className={`comm-col-left ${mobileTab === 'LIVE' ? 'mobile-show' : 'mobile-hide'}`}>
                    <ChatPanel active={true} />
                </section>

                {/* Right: Raid */}
                <section className={`comm-col-right ${mobileTab === 'RAID' ? 'mobile-show' : 'mobile-hide'}`}>
                    <RaidOpsPanel />
                </section>
            </div>
        </div>
    );
}
