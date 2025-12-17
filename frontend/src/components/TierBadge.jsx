
import React from 'react';
import { getTierStyle } from '../cosmetics/registry';

export const TierIcon = ({ tier, size = 16 }) => {
    const style = getTierStyle(tier);
    return (
        <span style={{
            color: style.isGradient ? '#c084fc' : style.color,
            fontSize: size,
            lineHeight: 1
        }}>
            {style.icon}
        </span>
    );
};

export function TierBadge({ tier, showLabel = true, size = 'sm', className = '' }) {
    const style = getTierStyle(tier);

    if (style.id === 'NONE') return null;

    // Size mappings
    const pxSize = size === 'xs' ? '10px' : '12px';
    const padding = size === 'xs' ? '1px 4px' : '2px 8px';

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-md select-none ${className} ${style.effect}`}
            style={{
                background: style.bg,
                color: style.isGradient ? '#fff' : style.color,
                padding: padding,
                fontSize: pxSize,
                fontWeight: style.weight,
                border: style.border || '1px solid transparent',
                letterSpacing: style.id === 'WHALE' ? '0.05em' : 'normal'
            }}
            title={`${style.label} Tier`}
        >
            <span style={{ fontSize: '1.2em', lineHeight: 1 }}>{style.icon}</span>
            {showLabel && <span>{style.label}</span>}
        </span>
    );
}
