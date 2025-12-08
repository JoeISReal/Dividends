import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';

export function EventPopup() {
    const { activeEvent } = useGame();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (activeEvent) {
            setVisible(true);
        }
    }, [activeEvent]);

    if (!activeEvent || !visible) return null;

    const colors = {
        yield_boost: 'from-[#3ce87e] to-[#3f8cff]',
        cost_reduction: 'from-[#3f8cff] to-[#3ce87e]',
        bad_luck: 'from-[#ff4e4e] to-[#ffa62b]',
        instant_grant: 'from-[#ffa62b] to-[#3ce87e]'
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
            <div className={`
        bg-gradient-to-br ${colors[activeEvent.type] || 'from-gray-700 to-gray-900'}
        p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4
        transform animate-scale-in
      `}>
                <div className="text-center">
                    <div className="text-5xl mb-4">🎉</div>
                    <h2 className="text-3xl font-bold text-white mb-3 uppercase tracking-wider">
                        {activeEvent.name}
                    </h2>
                    <p className="text-xl text-white/90 mb-6">
                        {activeEvent.description}
                    </p>
                    {activeEvent.duration > 0 && (
                        <div className="text-sm text-white/70">
                            Active for {activeEvent.duration} seconds
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setVisible(false)}
                    className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
