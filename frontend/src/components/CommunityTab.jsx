import React from 'react';

export default function CommunityTab() {
    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div className="main-header" style={{ width: '100%' }}>
                <div className="main-title">Community</div>
            </div>

            <div style={{
                width: '100%',
                maxWidth: '600px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '40px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px'
            }}>
                <div style={{ fontSize: '48px' }}>🐦</div>

                <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>
                        Join the X Community
                    </div>
                    <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5', maxWidth: '400px', margin: '0 auto' }}>
                        Connect with fellow degens, share your wins, and shape the future of the game.
                    </div>
                </div>

                <a
                    href="https://x.com/i/communities/1985125136924639660"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-action-primary"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        fontSize: '18px',
                        padding: '16px 32px',
                        background: '#1DA1F2',
                        marginTop: '16px',
                        transition: 'transform 0.2s',
                        borderRadius: '12px'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                    Join X Community 🚀
                </a>
            </div>
        </div>
    );
}
