/**
 * ContainerCapacityEditModal - Modal for editing container capacity
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useContainers } from '../hooks/useContainers';
import { useContainerValidation } from '../hooks/useContainerValidation';
import { CONTAINER_TYPE_LABELS, CONTAINER_CAPACITY_LIMITS } from '../types/container.types';
import type { ClassContainer } from '../types/container.types';

interface ContainerCapacityEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  container: ClassContainer | null;
  onSuccess?: () => void;
}

export function ContainerCapacityEditModal({
  isOpen,
  onClose,
  container,
  onSuccess
}: ContainerCapacityEditModalProps) {
  const { updateCapacity, loading } = useContainers({ autoFetch: false });
  const { validateCapacity, validationResult, validating, clearValidation } = useContainerValidation();

  const [newCapacity, setNewCapacity] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (container) {
      setNewCapacity(container.max_booking_count);
    }
    clearValidation();
    setError(null);
  }, [container, clearValidation]);

  const handleCapacityChange = async (value: number) => {
    setNewCapacity(value);
    setError(null);

    if (container && value !== container.max_booking_count) {
      // Validate the new capacity
      await validateCapacity(container.container_type, container.current_booking_count, value);
    } else {
      clearValidation();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!container) {
      setError('Container not found');
      return;
    }

    // Validate again before submitting
    const result = await validateCapacity(
      container.container_type,
      container.current_booking_count,
      newCapacity
    );

    if (!result.isValid) {
      setError(result.message);
      return;
    }

    const updateResult = await updateCapacity({
      container_id: container.id,
      new_max_booking_count: newCapacity
    });

    if (updateResult.success) {
      onSuccess?.();
      onClose();
    } else {
      setError(updateResult.error?.message || 'Failed to update capacity');
    }
  };

  if (!isOpen || !container) return null;

  const capacityLimit = CONTAINER_CAPACITY_LIMITS[container.container_type];
  const utilizationPercent = Math.round(
    (container.current_booking_count / container.max_booking_count) * 100
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Edit Container Capacity</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6 bg-gray-50 p-4 rounded-md">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Container Code:</span>
              <span className="font-medium">{container.container_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">
                {CONTAINER_TYPE_LABELS[container.container_type]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Bookings:</span>
              <span className="font-medium">{container.current_booking_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Capacity:</span>
              <span className="font-medium">{container.max_booking_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Utilization:</span>
              <span className="font-medium">{utilizationPercent}%</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Max Booking Count *
            </label>
            <input
              type="number"
              value={newCapacity}
              onChange={(e) => handleCapacityChange(parseInt(e.target.value) || 0)}
              min={container.container_type === 'individual' ? 1 : 1}
              max={capacityLimit.max}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading || validating || container.container_type === 'individual'}
            />
            <p className="text-xs text-gray-500 mt-1">
              {container.container_type === 'individual'
                ? 'Individual containers must have max count of 1'
                : `Range: ${capacityLimit.min} - ${capacityLimit.max}`}
            </p>
          </div>

          {/* Validation Result */}
          {validationResult && !validationResult.isValid && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              <p className="font-medium">Validation Warning</p>
              <p className="text-sm mt-1">{validationResult.message}</p>
            </div>
          )}

          {validationResult && validationResult.isValid && newCapacity !== container.max_booking_count && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
              <p className="text-sm">{validationResult.message}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={
                loading ||
                validating ||
                newCapacity === container.max_booking_count ||
                (validationResult && !validationResult.isValid)
              }
            >
              {loading ? 'Updating...' : 'Update Capacity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
