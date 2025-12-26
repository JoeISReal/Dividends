import React, { useEffect, useState } from 'react';

export default function ArenaIntro() {
    // Self-cleanup to remove from DOM after animation
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(false), 2500); // 2.5s total duration
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div className="arena-intro-overlay">
            <div className="intro-text">
                <div className="glitch" data-text="ENTERING ARENA">ENTERING ARENA</div>
                <div className="sub-text">ESTABLISHING SECURE FEED...</div>
            </div>
            <style>{`
                .arena-intro-overlay {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: #000;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeOut 0.5s ease 2s forwards;
                    pointer-events: none; /* Non-blocking immediately if user clicks through? No, blocking is okay for 2s aesthetic */
                }
                .intro-text {
                    text-align: center;
                    font-family: monospace;
                    color: #fff;
                }
                .glitch {
                    font-size: 32px;
                    font-weight: bold;
                    position: relative;
                    animation: glitch 0.3s cubic-bezier(.25, .46, .45, .94) both infinite;
                }
                .glitch:before, .glitch:after {
                    content: attr(data-text);
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }
                .glitch:before {
                    left: 2px;
                    text-shadow: -1px 0 #ff00c1;
                    clip: rect(44px, 450px, 56px, 0);
                    animation: glitch-anim-1 2s infinite linear alternate-reverse;
                }
                .glitch:after {
                    left: -2px;
                    text-shadow: -1px 0 #00fff9;
                    clip: rect(44px, 450px, 56px, 0);
                    animation: glitch-anim-2 2s infinite linear alternate-reverse;
                }
                .sub-text {
                    margin-top: 12px;
                    font-size: 12px;
                    letter-spacing: 0.2em;
                    opacity: 0;
                    animation: fadeIn 0.5s ease 0.5s forwards;
                    color: #3bffb0;
                }

                @keyframes fadeOut { to { opacity: 0; visibility: hidden; } }
                @keyframes fadeIn { to { opacity: 1; } }
                @keyframes glitch-anim-1 {
                    0% { clip: rect(20px, 9999px, 10px, 0); }
                    100% { clip: rect(80px, 9999px, 90px, 0); }
                }
                @keyframes glitch-anim-2 {
                    0% { clip: rect(70px, 9999px, 90px, 0); }
                    100% { clip: rect(10px, 9999px, 40px, 0); }
                }
            `}</style>
        </div>
    );
}
