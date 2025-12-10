import React, { useEffect } from 'react';
import { useGameStore } from '../state/gameStore';

export default function NotificationToast() {
    const notification = useGameStore(s => s.notification);
    const clearNotification = useGameStore(s => s.clearNotification);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                clearNotification();
            }, 4000); // 4 seconds duration
            return () => clearTimeout(timer);
        }
    }, [notification, clearNotification]);

    if (!notification) return null;

    const { message, type } = notification;

    // Styles based on type
    const isError = type === 'error' || type === 'bust';
    const isSuccess = type === 'success';

    // Icons
    let icon = '📢';
    if (type === 'bust') icon = '📉';
    if (type === 'error') icon = '⚠️';
    if (type === 'success') icon = '✅';

    return (
        <div style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#13141b',
            border: `1px solid ${isError ? '#ef4444' : isSuccess ? '#44ffb0' : 'rgba(255,255,255,0.2)'}`,
            padding: '12px 24px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            animation: 'fadeInSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            minWidth: '300px',
            maxWidth: '90vw',
        }}>
            <div style={{ fontSize: '20px' }}>{icon}</div>
            <div>{message}</div>

            <style>{`
                @keyframes fadeInSlideDown {
                    from { opacity: 0; transform: translate(-50%, -20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
            `}</style>
        </div>
    );
}
