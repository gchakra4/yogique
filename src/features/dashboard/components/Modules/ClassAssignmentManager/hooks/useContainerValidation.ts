/**
 * useContainerValidation Hook - Container capacity validation logic
 */

import { useState, useCallback } from 'react';
import { validateCapacityChange, getContainerCapacityInfo } from '../services/containerService';
import type { ContainerValidationResult } from '../types/container.types';

export function useContainerValidation() {
  const [validationResult, setValidationResult] = useState<ContainerValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  const validateCapacity = useCallback(
    async (containerType: string, currentBookings: number, newMaxBookings: number) => {
      setValidating(true);

      const result = await validateCapacityChange(
        containerType,
        currentBookings,
        newMaxBookings
      );

      setValidationResult(result);
      setValidating(false);

      return result;
    },
    []
  );

  const getCapacityInfo = useCallback(async (containerId: string) => {
    setValidating(true);

    const { data, error } = await getContainerCapacityInfo(containerId);

    setValidating(false);

    if (error) {
      return { success: false, error };
    }

    return { success: true, data, error: null };
  }, []);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);

  return {
    validationResult,
    validating,
    validateCapacity,
    getCapacityInfo,
    clearValidation
  };
}
