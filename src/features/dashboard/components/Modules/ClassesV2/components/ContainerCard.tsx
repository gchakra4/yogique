import React from 'react';

interface Container {
    id: string;
    name: string;
    instructor_name?: string | null;
    capacity_total?: number | null;
    capacity_enrolled?: number | null;
    assignment_count?: number;
    next_session_date?: string | null; // YYYY-MM-DD
    next_session_time?: string | null; // HH:MM
}

interface ContainerCardProps {
    container: Container;
    onClick?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
}

const formatDate = (date?: string) => {
    if (!date) return '—';
    try {
        const d = new Date(date);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
        return date;
    }
};

const CapacityIndicator: React.FC<{ current?: number | null; max?: number | null }> = ({ current = 0, max = 0 }) => {
    const pct = !max || max <= 0 ? 0 : Math.min(100, Math.round((Number(current || 0) / Number(max)) * 100));
    const colorClass = pct < 61 ? 'bg-emerald-500' : pct < 86 ? 'bg-amber-500' : 'bg-rose-500';
    return (
        <div className="w-full">
            <div
                className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={max ?? 0}
                aria-valuenow={current ?? 0}
                aria-label={`Capacity: ${current ?? 0} of ${max ?? 0} enrolled (${pct}%)`}
            >
                <div className={`${colorClass} h-full transition-all duration-300`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

export const ContainerCard: React.FC<ContainerCardProps> = ({ container, onClick, onEdit, onDelete }) => {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onClick?.(container.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(container.id); }}
            className="w-[250px] max-w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-xl hover:scale-[1.02] transform transition-all duration-300 overflow-hidden cursor-pointer"
        >
            <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">{container.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400 truncate">{container.instructor_name ?? 'Unassigned'}</p>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                        <button
                            type="button"
                            aria-label="Options"
                            onClick={(e) => { e.stopPropagation(); onEdit?.(container.id); }}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h.01M12 12h.01M18 12h.01" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 dark:text-slate-400">Capacity</div>
                        <div className="text-xs font-medium text-gray-800 dark:text-white">{(container.capacity_enrolled ?? 0)}/{container.capacity_total ?? '—'}</div>
                    </div>
                    <CapacityIndicator current={container.capacity_enrolled ?? 0} max={container.capacity_total ?? 0} />
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3M16 7V3M3 11h18M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" />
                        </svg>
                        <span>{container.assignment_count ?? 0} assignments</span>
                    </div>
                    <div>{container.next_session_date ? `${formatDate(container.next_session_date)} ${container.next_session_time ?? ''}` : '—'}</div>
                </div>
            </div>
        </div>
    );
};

export default ContainerCard;
