// frontend/src/components/ProgressBar.jsx
import React from 'react'
export default function ProgressBar({ value = 0 }) {
    const pct = Math.max(0, Math.min(100, value * 100))
    return (
        <div style={{ height: 8, background: '#222', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: '#3f8cff' }} />
        </div>
    )
}
