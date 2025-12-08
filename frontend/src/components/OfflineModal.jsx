import React from 'react';
import { useGame } from '../context/GameContext';

export function OfflineModal() {
    const { offlineEarnings, setOfflineEarnings } = useGame();

    if (offlineEarnings <= 0) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="bg-gray-900 border-2 border-green-500 p-8 rounded-xl max-w-md w-full text-center shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                <h2 className="text-3xl font-bold mb-4 text-white">WELCOME BACK!</h2>
                <p className="text-gray-400 mb-6">
                    Your empire continued to generate yield while you were away.
                </p>

                <div className="text-5xl font-bold text-green-400 mb-8">
                    +${Math.floor(offlineEarnings).toLocaleString()}
                </div>

                <button
                    onClick={() => setOfflineEarnings(0)}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-full transition-all hover:scale-105"
                >
                    CLAIM YIELD
                </button>
            </div>
        </div>
    );
}
