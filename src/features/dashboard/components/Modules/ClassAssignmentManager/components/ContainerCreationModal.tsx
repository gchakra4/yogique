/**
 * ContainerCreationModal - Modal for creating new class containers
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useContainers } from '../hooks/useContainers';
import { CONTAINER_TYPE_LABELS, CONTAINER_TYPE_DESCRIPTIONS, CONTAINER_CAPACITY_LIMITS } from '../types/container.types';
import type { ContainerType } from '../types/container.types';

interface ContainerCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructorId: string;
  currentUserId: string;
  onSuccess?: (containerId: string) => void;
}

export function ContainerCreationModal({
  isOpen,
  onClose,
  instructorId,
  currentUserId,
  onSuccess
}: ContainerCreationModalProps) {
  const { createNewContainer, loading } = useContainers({ autoFetch: false });

  const [formData, setFormData] = useState({
    container_code: '',
    container_type: 'individual' as ContainerType,
    max_booking_count: 1,
    notes: ''
  });

  const [error, setError] = useState<string | null>(null);

  const handleTypeChange = (newType: ContainerType) => {
    setFormData((prev) => ({
      ...prev,
      container_type: newType,
      max_booking_count: newType === 'individual' ? 1 : 10
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.container_code.trim()) {
      setError('Container code is required');
      return;
    }

    if (formData.container_type === 'individual' && formData.max_booking_count !== 1) {
      setError('Individual containers must have max booking count of 1');
      return;
    }

    const limit = CONTAINER_CAPACITY_LIMITS[formData.container_type];
    if (formData.max_booking_count > limit.max) {
      setError(`${CONTAINER_TYPE_LABELS[formData.container_type]} containers cannot exceed ${limit.max} bookings`);
      return;
    }

    const result = await createNewContainer(
      {
        container_code: formData.container_code.trim(),
        container_type: formData.container_type,
        instructor_id: instructorId,
        max_booking_count: formData.max_booking_count,
        notes: formData.notes.trim() || null
      },
      currentUserId
    );

    if (result.success && result.data) {
      onSuccess?.(result.data.id);
      onClose();
      // Reset form
      setFormData({
        container_code: '',
        container_type: 'individual',
        max_booking_count: 1,
        notes: ''
      });
    } else {
      setError(result.error?.message || 'Failed to create container');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Create Class Container</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Container Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Container Code *
            </label>
            <input
              type="text"
              value={formData.container_code}
              onChange={(e) => setFormData((prev) => ({ ...prev, container_code: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., T5-123-2024-01"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Unique identifier for this container</p>
          </div>

          {/* Container Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Container Type *
            </label>
            <select
              value={formData.container_type}
              onChange={(e) => handleTypeChange(e.target.value as ContainerType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {Object.entries(CONTAINER_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {CONTAINER_TYPE_DESCRIPTIONS[formData.container_type]}
            </p>
          </div>

          {/* Max Booking Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Booking Count *
            </label>
            <input
              type="number"
              value={formData.max_booking_count}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  max_booking_count: parseInt(e.target.value) || 1
                }))
              }
              min={formData.container_type === 'individual' ? 1 : 1}
              max={CONTAINER_CAPACITY_LIMITS[formData.container_type].max}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading || formData.container_type === 'individual'}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.container_type === 'individual'
                ? 'Individual containers must have max count of 1'
                : `Maximum allowed: ${CONTAINER_CAPACITY_LIMITS[formData.container_type].max}`}
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes about this container..."
              disabled={loading}
            />
          </div>

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
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Container'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
