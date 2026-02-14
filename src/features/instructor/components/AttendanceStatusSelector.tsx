import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    ATTENDANCE_OPTIONS,
    STATUS_METADATA,
    getAttendanceBadgeClasses
} from '../../../shared/constants/attendanceStatus';
import { AttendanceStatus } from '../../../shared/types/attendance';

interface AttendanceStatusSelectorProps {
    value: AttendanceStatus;
    disabled?: boolean;
    onChange: (next: AttendanceStatus) => void;
    size?: 'sm' | 'md';
    inline?: boolean;
    showDescriptions?: boolean;
    label?: string;
}

/**
 * Selector for attendance status.
 * Renders either a compact dropdown (default) or an inline segmented control if inline=true.
 */
export const AttendanceStatusSelector: React.FC<AttendanceStatusSelectorProps> = ({
    value,
    disabled = false,
    onChange,
    size = 'md',
    inline = false,
    showDescriptions = false,
    label
}) => {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);

    const canUseDOM = typeof document !== 'undefined';

    const updateMenuPos = () => {
        const el = buttonRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setMenuPos({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
        });
    };

    // When opening, measure immediately to avoid visible jump.
    useLayoutEffect(() => {
        if (!open) return;
        updateMenuPos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Keep menu positioned on scroll/resize.
    useEffect(() => {
        if (!open) return;
        let raf = 0;
        const onMove = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(updateMenuPos);
        };
        window.addEventListener('scroll', onMove, true);
        window.addEventListener('resize', onMove);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onMove, true);
            window.removeEventListener('resize', onMove);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const menuNode = useMemo(() => {
        if (!open || disabled || !canUseDOM || !menuPos) return null;
        return createPortal(
            <div
                className="fixed z-50"
                style={{ top: menuPos.top, left: menuPos.left }}
            >
                <div
                    className="w-72 max-h-80 overflow-auto origin-top-left bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg p-2"
                >
                    {ATTENDANCE_OPTIONS.map(opt => {
                        const active = opt.value === value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                                className={`w-full text-left p-2 rounded-md flex flex-col gap-1 transition ${active
                                    ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-300 dark:ring-blue-600'
                                    : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`${getAttendanceBadgeClasses(opt.value)} border px-2 py-0.5`}>
                                        {STATUS_METADATA[opt.value].label}
                                    </span>
                                    {active && (
                                        <svg className="w-4 h-4 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <p className="text-[11px] leading-snug text-gray-600 dark:text-slate-400">
                                    {STATUS_METADATA[opt.value].description}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>,
            document.body
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, disabled, canUseDOM, menuPos, value]);

    if (inline) {
        return (
            <div className="space-y-1">
                {label && (
                    <p className="text-xs font-medium text-gray-600 dark:text-slate-400">{label}</p>
                )}
                <div className="flex flex-wrap gap-2">
                    {ATTENDANCE_OPTIONS.map(opt => {
                        const active = opt.value === value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                disabled={disabled}
                                onClick={() => onChange(opt.value)}
                                title={opt.description}
                                className={`transition-all border rounded-full px-3 py-1 text-xs font-medium focus:outline-none
                                    ${active
                                        ? getAttendanceBadgeClasses(opt.value)
                                        : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600'
                                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {STATUS_METADATA[opt.value].label}
                            </button>
                        );
                    })}
                </div>
                {showDescriptions && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 max-h-48 overflow-auto pr-1">
                        {ATTENDANCE_OPTIONS.map(opt => (
                            <div key={opt.value} className="text-xs p-2 rounded border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`inline-block w-2 h-2 rounded-full bg-${STATUS_METADATA[opt.value].color}-500`} />
                                    <span className="font-semibold">{STATUS_METADATA[opt.value].label}</span>
                                </div>
                                <p className="text-gray-600 dark:text-slate-400 leading-snug">{STATUS_METADATA[opt.value].description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Dropdown version
    return (
        <div className="relative inline-block text-left">
            {label && (
                <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{label}</p>
            )}
            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                onClick={() => {
                    setOpen(o => {
                        const next = !o;
                        if (next) {
                            // ensure we position the menu for the next paint
                            queueMicrotask(() => updateMenuPos());
                        }
                        return next;
                    });
                }}
                className={`w-full min-w-[160px] justify-between inline-flex items-center gap-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 px-3 ${size === 'sm' ? 'py-1 text-xs' : 'py-2 text-sm'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-slate-600'}`}
            >
                <span className={`flex-1 text-left truncate ${getAttendanceBadgeClasses(value)} border-0 px-0 py-0 bg-transparent`}>
                    {STATUS_METADATA[value].label}
                </span>
                <svg
                    className="w-4 h-4 text-gray-500 dark:text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {menuNode}
            {open && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOpen(false)}
                    aria-hidden="true"
                />
            )}
        </div>
    );
};
