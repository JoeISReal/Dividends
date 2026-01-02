import React, { useState, useMemo } from 'react';
import { MANUAL_CHAPTERS } from '../data/manualContent';

export default function HelpTab() {
    const [activeChapterId, setActiveChapterId] = useState(MANUAL_CHAPTERS[0].id);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter chapters based on search query
    const filteredChapters = useMemo(() => {
        if (!searchQuery.trim()) return MANUAL_CHAPTERS;
        const lowerQuery = searchQuery.toLowerCase();
        return MANUAL_CHAPTERS.filter(chapter =>
            chapter.title.toLowerCase().includes(lowerQuery) ||
            chapter.label.toLowerCase().includes(lowerQuery) ||
            (chapter.keywords && chapter.keywords.some(k => k.toLowerCase().includes(lowerQuery)))
        );
    }, [searchQuery]);

    // Get active content
    const activeContent = MANUAL_CHAPTERS.find(c => c.id === activeChapterId) || MANUAL_CHAPTERS[0];

    return (
        <div className="manual-container">
            {/* SIDEBAR NAVIGATION */}
            <div className="manual-sidebar">
                <div className="manual-sidebar-header">
                    <span className="mono">SYS_MANUAL_V2</span>
                    <div className="manual-search-wrapper">
                        <svg className="search-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            className="manual-search-input mono"
                            placeholder="SEARCH_DATABASE..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="manual-nav custom-scroll">
                    {filteredChapters.length > 0 ? (
                        filteredChapters.map(chapter => (
                            <button
                                key={chapter.id}
                                className={`manual-nav-item ${activeChapterId === chapter.id ? 'active' : ''}`}
                                onClick={() => setActiveChapterId(chapter.id)}
                            >
                                <span className="chapter-id mono">{chapter.title.split('.')[0]}</span>
                                <span className="chapter-label">{chapter.label}</span>
                            </button>
                        ))
                    ) : (
                        <div className="manual-no-results mono">
                            NO MATCHES FOUND
                        </div>
                    )}
                </div>

                <div className="manual-sidebar-footer mono">
                    CLASSIFIED // EYES ONLY
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="manual-content custom-scroll">
                <div className="manual-paper">
                    {activeContent.content}
                </div>
            </div>

            <style>{`
                .manual-container {
                    display: grid;
                    grid-template-columns: 260px 1fr;
                    height: 100%;
                    gap: 0;
                    font-family: 'Inter', sans-serif;
                    overflow: hidden;
                    max-width: 100%;
                    width: 100%;
                    background: rgba(0, 0, 0, 0.2);
                }

                /* SIDEBAR */
                .manual-sidebar {
                    border-right: 1px solid var(--border-subtle);
                    display: flex;
                    flex-direction: column;
                    padding: 16px;
                    background: rgba(0, 0, 0, 0.1);
                }

                .manual-sidebar-header {
                    padding-bottom: 0;
                    margin-bottom: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .manual-sidebar-header > span.mono {
                    color: var(--text-muted);
                    font-size: 10px;
                    letter-spacing: 0.2em;
                    opacity: 0.7;
                }

                .manual-search-wrapper {
                    position: relative;
                    width: 100%;
                }

                .search-icon {
                    position: absolute;
                    left: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-muted);
                    pointer-events: none;
                }

                .manual-search-input {
                    display: block;
                    width: 100%;
                    padding: 8px 10px 8px 30px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid var(--border-subtle);
                    border-radius: 4px;
                    color: var(--text-primary);
                    font-size: 11px;
                    outline: none;
                    transition: border-color 0.2s;
                }

                .manual-search-input:focus {
                    border-color: var(--accent-gold);
                    background: rgba(255, 255, 255, 0.05);
                }

                .manual-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    overflow-y: auto;
                    padding-right: 4px; /* Space for scrollbar */
                }

                .manual-nav-item {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 10px 12px;
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 6px;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                    opacity: 0.6;
                }

                .manual-nav-item:hover {
                    opacity: 1;
                    background: rgba(255,255,255,0.03);
                }

                .manual-nav-item.active {
                    opacity: 1;
                    background: rgba(255,214,113,0.08); /* Gold tint */
                    border-color: rgba(255,214,113,0.2);
                }

                .manual-nav-item.active .chapter-id {
                    color: var(--accent-gold);
                }

                .chapter-id {
                    font-size: 10px;
                    color: var(--text-muted);
                    margin-bottom: 2px;
                    transition: color 0.2s;
                }

                .chapter-label {
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-primary);
                }
                
                .manual-no-results {
                    padding: 20px;
                    text-align: center;
                    font-size: 11px;
                    color: var(--text-muted);
                    border: 1px dashed var(--border-subtle);
                    border-radius: 6px;
                }

                .manual-sidebar-footer {
                    margin-top: auto;
                    padding-top: 16px;
                    font-size: 9px;
                    color: var(--text-muted);
                    opacity: 0.3;
                    letter-spacing: 0.2em;
                    text-align: center;
                }

                /* CONTENT */
                .manual-content {
                    overflow-y: auto;
                    padding: 24px 32px;
                    background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 100%);
                }

                .manual-paper {
                    animation: fadeIn 0.3s ease;
                    max-width: 800px;
                    margin: 0 auto;
                }

                .manual-header {
                    margin-bottom: 32px;
                    border-bottom: 1px solid var(--border-subtle);
                    padding-bottom: 16px;
                }

                .manual-header h1 {
                    font-family: 'SF Mono', monospace;
                    font-size: 24px;
                    margin: 0 0 8px 0;
                    letter-spacing: -0.02em;
                    color: var(--text-primary);
                }

                .manual-subtitle {
                    font-family: 'SF Mono', monospace;
                    font-size: 11px;
                    color: var(--accent-gold);
                    background: rgba(255, 214, 113, 0.1);
                    padding: 2px 6px;
                    border-radius: 3px;
                }

                .manual-body {
                    color: var(--text-secondary);
                    line-height: 1.7;
                    font-size: 15px;
                }
                
                .manual-body p {
                    margin-bottom: 16px;
                }

                .manual-body h3 {
                    margin: 36px 0 16px 0;
                    font-size: 14px;
                    color: var(--text-primary);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border-left: 3px solid var(--accent-gold);
                    padding-left: 12px;
                    font-weight: 700;
                }

                .manual-alert {
                    background: rgba(255, 214, 113, 0.05);
                    border: 1px solid rgba(255, 214, 113, 0.2);
                    padding: 16px;
                    border-radius: 6px;
                    margin: 24px 0;
                }
                .manual-alert.caution {
                    background: rgba(239, 68, 68, 0.05);
                    border-color: rgba(239, 68, 68, 0.2);
                    color: #fca5a5;
                }

                .manual-list {
                    list-style: none;
                    padding: 0;
                }
                
                .manual-list li {
                    margin-bottom: 12px;
                    padding-left: 16px;
                    border-left: 1px solid var(--border-subtle);
                }

                .manual-code {
                    background: rgba(0,0,0,0.3);
                    padding: 16px;
                    border-radius: 6px;
                    font-family: 'SF Mono', monospace;
                    font-size: 13px;
                    color: var(--accent-green);
                    border: 1px solid var(--border-subtle);
                    margin: 16px 0;
                    white-space: pre-wrap; 
                }

                .manual-table {
                    display: flex;
                    flex-direction: column;
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    overflow: hidden;
                    margin: 16px 0;
                    background: rgba(0,0,0,0.2);
                }

                .manual-table .row {
                    display: grid;
                    grid-template-columns: 1fr 2fr 1.5fr;
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border-subtle);
                    font-size: 13px;
                    align-items: center;
                }
                .manual-table .row:last-child { border-bottom: none; }
                .manual-table .header {
                    background: rgba(255,255,255,0.03);
                    font-weight: 700;
                    color: var(--text-primary);
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .low { color: var(--accent-green); }
                .med { color: var(--accent-gold); }
                .high { color: var(--accent-orange); }
                .crit { color: var(--accent-red); }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                /* Custom Scrollbar */
                .custom-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scroll::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.1);
                }
                .custom-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 3px;
                }
                .custom-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.2);
                }

                /* Mobile responsive tweaks */
                @media (max-width: 768px) {
                    .manual-container {
                        grid-template-columns: 1fr;
                        grid-template-rows: auto 1fr;
                    }
                    .manual-sidebar {
                        border-right: none;
                        border-bottom: 1px solid var(--border-subtle);
                        padding-bottom: 16px;
                        max-height: 200px; /* Limit sidebar height on mobile */
                    }
                    .manual-nav {
                        flex-direction: row;
                        overflow-x: auto;
                        padding-bottom: 8px;
                    }
                    .manual-nav-item {
                        min-width: 140px;
                    }
                }
            `}</style>
        </div>
    );
}
