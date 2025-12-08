import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export function TopBar() {
    const { gameState } = useGame();
    const location = useLocation();

    if (!gameState) return null;

    const { meta } = gameState;

    const tabs = [
        { path: '/', label: 'Streams' },
        { path: '/upgrades', label: 'Upgrades' },
        { path: '/prestige', label: 'Prestige' },
        { path: '/stats', label: 'Stats' }
    ];

    return (
        <header className="bg-[#1a1a1a] border-b border-gray-800 sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xl">◎</span>
                        </div>
                        <span className="text-xl font-semibold text-white">Dividends Simulator</span>
                    </div>

                    <div className="text-right">
                        <div className="text-sm text-gray-400 mb-1">Yield Per Second</div>
                        <div className="text-3xl font-bold text-white">
                            {Math.floor(meta.yieldPerSecond).toFixed(2)}
                        </div>
                    </div>
                </div>

                <nav className="flex gap-8 border-b border-gray-800">
                    {tabs.map(tab => {
                        const isActive = location.pathname === tab.path;
                        return (
                            <Link
                                key={tab.path}
                                to={tab.path}
                                className={`
                  pb-3 text-base font-medium transition-colors relative
                  ${isActive
                                        ? 'text-white'
                                        : 'text-gray-400 hover:text-gray-300'}
                `}
                            >
                                {tab.label}
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}
