/**
 * Capacity-related types used by capacity components/services
 */
export interface CapacitySnapshot {
  total: number | null;
  booked: number | null;
  available: number | null;
}

export interface CapacityThresholds {
  warning: number; // e.g., 0.75
  critical: number; // e.g., 0.95
}

export interface CapacityIndicatorProps {
  snapshot: CapacitySnapshot;
  thresholds?: CapacityThresholds;
  size?: 'small' | 'medium' | 'large';
}
