import React from 'react';

export function BagsWidget() {
    return (
        <div className="surface-hud surface-subordinate" style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 'var(--radius-md)',
            // Taller height to ensure we catch the 'Amount Sent' section which is lower down
            height: '320px',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
        }}>
            {/* Header/Label Overlay - optional, but helps frame it */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                padding: '4px 8px',
                background: 'rgba(0,0,0,0.7)',
                fontSize: 10,
                color: 'var(--text-muted)',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                zIndex: 10,
                borderBottomRightRadius: 8
            }}>
                Official Bags.fm Channel
            </div>

            <iframe
                src="https://bags.fm/$DIVIDENDSBOT"
                title="Bags.fm Profile"
                style={{
                    position: 'absolute',
                    width: '120%',
                    height: '1000px', // Plenty of scroll depth available
                    border: 'none',
                    // Aggressive crop to hide the sticky header/nav bar
                    top: '-180px',
                    left: '-10%',
                    pointerEvents: 'none', // LOCKS the view
                }}
                scrolling="no"
            />

            {/* Link overlay to allow clicking OUT if they really want to? 
                User said "lock the view... see amount sent". 
                Usually creating a click-through transparent div is good UX if they want to go to the real site,
                but user requested 'lock the view'. I'll leave it strictly read-only for now.
                Maybe a small icon in corner to 'Open Link' is safer than a dead widget.
            */}
            <a href="https://bags.fm/$DIVIDENDSBOT" target="_blank" rel="noopener noreferrer" style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                fontSize: 12,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                background: 'rgba(0,0,0,0.6)',
                padding: '4px 8px',
                borderRadius: 4,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 4
            }}>
                Open ↗
            </a>
        </div>
    );
}
