import React from 'react';

export default function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: '#1A1B23',
                border: '1px solid rgba(171, 159, 242, 0.3)',
                borderRadius: 16,
                padding: 24,
                width: 320,
                maxWidth: '90%',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                animation: 'fadeUp 0.2s ease-out'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: 12, color: '#fff' }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
                    {message}
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            padding: '8px 16px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            background: '#AB9FF2',
                            border: 'none',
                            color: '#000',
                            padding: '8px 16px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
