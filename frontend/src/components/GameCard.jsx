import React from 'react';

export function GameCard({ title, children, className = '' }) {
    return (
        <div className={`bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 ${className}`}>
            {title && <h3 className="text-xl font-bold mb-4 text-white">{title}</h3>}
            {children}
        </div>
    );
}
