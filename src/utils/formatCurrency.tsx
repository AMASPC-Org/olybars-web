import React from 'react';
import { GAMIFICATION_CONFIG } from '../config/gamification';

interface FormatCurrencyProps {
    amount: number;
    showIcon?: boolean;
    showLabel?: boolean;
    className?: string; // Additional classes
    variant?: 'default' | 'highlight' | 'warning';
    hideSign?: boolean;
}

export const FormatCurrency: React.FC<FormatCurrencyProps> = ({
    amount,
    showIcon = true,
    showLabel = true,
    className = '',
    variant = 'default',
    hideSign = false
}) => {

    let colorClass = GAMIFICATION_CONFIG.CURRENCY.COLOR.TEXT;

    if (variant === 'highlight') colorClass = 'text-yellow-400';
    if (variant === 'warning') colorClass = 'text-red-400';

    const displayAmount = hideSign ? Math.abs(amount) : (amount > 0 ? `+${amount}` : amount);

    return (
        <span className={`font-league uppercase tracking-wide inline-flex items-center gap-1 ${className}`}>
            <span className={`font-black ${colorClass}`}>{displayAmount}</span>
            {showIcon && <span className="text-sm">{GAMIFICATION_CONFIG.CURRENCY.SYMBOL}</span>}
            {showLabel && <span className={`text-[10px] ${colorClass}`}>{GAMIFICATION_CONFIG.CURRENCY.UNIT}</span>}
        </span>
    );
};

// Helper for pure string return if needed (e.g. titles)
export const formatCurrencyString = (amount: number) => {
    return `+${amount} ${GAMIFICATION_CONFIG.CURRENCY.UNIT}`;
};
