import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function BottomNav() {
    const location = useLocation();

    const tabs = [
        { path: '/', label: 'Streams', icon: '📊' },
        { path: '/upgrades', label: 'Upgrades', icon: '⚡' },
        { path: '/prestige', label: 'Prestige', icon: '👑' },
        { path: '/stats', label: 'Stats', icon: '📈' }
    ];

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-[#16161a] border-t border-gray-800 z-50">
            <div className="max-w-6xl mx-auto flex">
                {tabs.map(tab => {
                    const isActive = location.pathname === tab.path;
                    return (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            className={`
                flex-1 py-4 text-center font-bold transition-all duration-200
                ${isActive
                                    ? 'text-[#3f8cff] border-t-2 border-[#3f8cff] bg-[#3f8cff]/10'
                                    : 'text-[#b5b5c6] hover:text-white hover:bg-white/5'}
              `}
                        >
                            <div className="text-2xl mb-1">{tab.icon}</div>
                            <div className="text-sm uppercase tracking-wider">{tab.label}</div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
