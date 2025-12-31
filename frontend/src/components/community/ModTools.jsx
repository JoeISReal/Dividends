
import React from 'react';

export function ModTools({ targetId, targetHandle, currentRole, onAction }) {
    // Only verify basic existence, parent should gate visibility via role check
    if (!targetId || !targetHandle) return null;

    return (
        <div className="mod-tools">
            <button
                className="btn-mod btn-mod-remove"
                onClick={() => onAction('remove', targetId)}
                title="Remove Message"
            >
                DEL
            </button>
            <button
                className="btn-mod btn-mod-shadow"
                onClick={() => onAction('shadow', targetId)}
                title="Shadow Ban Message"
            >
                SHD
            </button>
            <button
                className="btn-mod btn-mod-mute"
                onClick={() => onAction('mute', targetHandle, 'Toxic', 300000)} // 5m Default
                title="Mute User (5m)"
            >
                MUT
            </button>
        </div>
    );
}
