import React from 'react';

interface CapacityIndicatorProps {
    current: number;
    max: number;
    size?: 'sm' | 'md';
    showLabel?: boolean;
    className?: string;
    ariaLabel?: string;
}

const getColorClass = (pct: number) => {
    if (pct < 61) return 'bg-emerald-500 dark:bg-emerald-400';
    if (pct < 86) return 'bg-amber-500 dark:bg-amber-400';
    return 'bg-rose-500 dark:bg-rose-400';
};

export const CapacityIndicator: React.FC<CapacityIndicatorProps> = ({
    current,
    max,
    size = 'md',
    showLabel = true,
    className = '',
    ariaLabel,
}) => {
    const safeMax = Math.max(0, Math.floor(max));
    const safeCurrent = Math.max(0, Math.floor(current));
    const pct = safeMax > 0 ? Math.round((safeCurrent / safeMax) * 100) : 0;
    const colorClass = getColorClass(pct);
    const heightClass = size === 'sm' ? 'h-1.5' : 'h-2';

    const label = ariaLabel || `Capacity: ${safeCurrent} of ${safeMax} enrolled (${pct}%)`;

    return (
        <div className={`w-full ${className}`}>
            {showLabel && (
                <div className="text-xs text-gray-600 dark:text-slate-400 mb-1">
                    {safeMax > 0 ? `${safeCurrent}/${safeMax} enrolled` : 'Capacity: N/A'}
                </div>
            )}

            <div
                className={`w-full ${heightClass} bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden`}
                role={safeMax > 0 ? 'progressbar' : undefined}
                aria-label={safeMax > 0 ? label : undefined}
                aria-valuenow={safeMax > 0 ? safeCurrent : undefined}
                aria-valuemin={safeMax > 0 ? 0 : undefined}
                aria-valuemax={safeMax > 0 ? safeMax : undefined}
            >
                <div
                    className={`${colorClass} h-full rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    aria-hidden={safeMax <= 0}
                />
            </div>
        </div>
    );
};

export default CapacityIndicator;
