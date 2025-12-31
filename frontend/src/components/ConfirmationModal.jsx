import React, { useEffect } from 'react';

/**
 * Terminal-style confirmation modal.
 * 
 * Props:
 * - title: string
 * - message: string (supports \n for newlines)
 * - onConfirm: () => void
 * - onCancel: () => void
 * - confirmLabel: string (default "CONFIRM")
 * - cancelLabel: string (default "CANCEL")
 * - isDangerous: boolean (default false, makes confirm button red)
 */
export function ConfirmationModal({
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = "CONFIRM",
    cancelLabel = "CANCEL",
    isDangerous = false
}) {

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onCancel]);

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-pop-in">
                <div className="modal-header">
                    <span className="modal-title">{title}</span>
                </div>

                <div className="modal-body">
                    {message.split('\n').map((line, i) => (
                        <p key={i} className="modal-text-line">{line}</p>
                    ))}
                </div>

                <div className="modal-actions">
                    <button className="btn-modal-cancel" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        className={`btn-modal-confirm ${isDangerous ? 'btn-danger' : ''}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
