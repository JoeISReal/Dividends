import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const confirm = useCallback((message, onConfirm) => {
        const id = Date.now();
        setToasts(prev => [...prev, {
            id,
            message,
            type: 'confirm',
            onConfirm: () => {
                setToasts(prev => prev.filter(t => t.id !== id));
                onConfirm();
            },
            onCancel: () => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }
        }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, confirm }}>
            {children}
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 10000,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxWidth: '400px'
            }}>
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function Toast({ id, message, type, onConfirm, onCancel, onClose }) {
    const colors = {
        success: { bg: 'rgba(76,217,100,0.15)', border: '#30d158', icon: '✅' },
        error: { bg: 'rgba(255,59,48,0.15)', border: '#ff453a', icon: '❌' },
        warning: { bg: 'rgba(255,159,10,0.15)', border: '#ff9f0a', icon: '⚠️' },
        info: { bg: 'rgba(10,132,255,0.15)', border: '#0a84ff', icon: 'ℹ️' },
        confirm: { bg: 'rgba(255,159,10,0.15)', border: '#ff9f0a', icon: '❓' }
    };

    const style = colors[type] || colors.info;

    if (type === 'confirm') {
        return (
            <div style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: '12px',
                padding: '16px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                animation: 'slideIn 0.3s ease-out'
            }}>
                <div style={{
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{ fontSize: '18px' }}>{style.icon}</span>
                    <span>{message}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '8px 16px',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '6px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '8px 16px',
                            background: style.border,
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600
                        }}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            background: style.bg,
            border: `1px solid ${style.border}`,
            borderRadius: '12px',
            padding: '12px 16px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideIn 0.3s ease-out',
            cursor: 'pointer'
        }}
            onClick={onClose}
        >
            <span style={{ fontSize: '18px' }}>{style.icon}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-primary)', flex: 1 }}>{message}</span>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '0 4px'
                }}
            >
                ×
            </button>
        </div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

// Add animation keyframes to global styles
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}
