/**
 * ContainerCapacityIndicator - Visual indicator for container capacity and utilization
 */
import { AlertTriangle, CheckCircle, Users, XCircle } from 'lucide-react';
import type { ClassContainer } from '../types/container.types';
import { CONTAINER_TYPE_LABELS } from '../types/container.types';

interface ContainerCapacityIndicatorProps {
    container: ClassContainer;
    showDetails?: boolean;
    size?: 'sm' | 'md' | 'lg';
    onEdit?: () => void;
}

export function ContainerCapacityIndicator({
    container,
    showDetails = false,
    size = 'md',
    onEdit
}: ContainerCapacityIndicatorProps) {
    const utilizationPercent = Math.round(
        (container.current_booking_count / container.max_booking_count) * 100
    );

    const isFull = container.current_booking_count >= container.max_booking_count;
    const isNearFull = utilizationPercent >= 80 && !isFull;
    const isEmpty = container.current_booking_count === 0;

    // Determine color scheme based on utilization
    let colorClasses = {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
        progress: 'bg-green-500'
    };

    if (isFull) {
        colorClasses = {
            bg: 'bg-red-100',
            text: 'text-red-800',
            border: 'border-red-300',
            progress: 'bg-red-500'
        };
    } else if (isNearFull) {
        colorClasses = {
            bg: 'bg-yellow-100',
            text: 'text-yellow-800',
            border: 'border-yellow-300',
            progress: 'bg-yellow-500'
        };
    }

    const sizeClasses = {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-2',
        lg: 'text-base px-4 py-3'
    };

    const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 20;

    const StatusIcon = isFull ? XCircle : isNearFull ? AlertTriangle : CheckCircle;

    return (
        <div className={`${colorClasses.bg} ${colorClasses.border} border rounded-md ${sizeClasses[size]}`}>
            <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-2">
                    <Users size={iconSize} className={colorClasses.text} />
                    <div>
                        <div className={`font-medium ${colorClasses.text}`}>
                            {container.current_booking_count} / {container.max_booking_count}
                        </div>
                        {showDetails && (
                            <div className="text-xs text-gray-600 mt-0.5">
                                {CONTAINER_TYPE_LABELS[container.container_type]}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <StatusIcon size={iconSize} className={colorClasses.text} />
                    {onEdit && !isFull && container.container_type !== 'individual' && (
                        <button
                            onClick={onEdit}
                            className={`text-xs ${colorClasses.text} hover:underline`}
                        >
                            Edit
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            {showDetails && (
                <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`${colorClasses.progress} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>{utilizationPercent}% utilized</span>
                        <span>
                            {isFull ? 'Full' : isNearFull ? 'Near Full' : isEmpty ? 'Empty' : 'Available'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * ContainerCapacityBadge - Compact badge version for inline display
 */
interface ContainerCapacityBadgeProps {
    container: ClassContainer;
    onClick?: () => void;
}

export function ContainerCapacityBadge({ container, onClick }: ContainerCapacityBadgeProps) {
    const utilizationPercent = Math.round(
        (container.current_booking_count / container.max_booking_count) * 100
    );

    const isFull = container.current_booking_count >= container.max_booking_count;
    const isNearFull = utilizationPercent >= 80 && !isFull;

    let colorClasses = 'bg-green-100 text-green-800 border-green-300';
    if (isFull) {
        colorClasses = 'bg-red-100 text-red-800 border-red-300';
    } else if (isNearFull) {
        colorClasses = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }

    return (
        <span
            className={`inline-flex items-center space-x-1 px-2 py-0.5 border rounded text-xs font-medium ${colorClasses} ${onClick ? 'cursor-pointer hover:opacity-80' : ''
                }`}
            onClick={onClick}
        >
            <Users size={12} />
            <span>
                {container.current_booking_count}/{container.max_booking_count}
            </span>
        </span>
    );
}
