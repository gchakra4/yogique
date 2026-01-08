/**
 * useContainers Hook - Manage container state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchContainers, createContainer, updateContainerCapacity, deactivateContainer } from '../services/containerService';
import type { ClassContainer, CreateContainerRequest, UpdateContainerCapacityRequest } from '../types/container.types';

interface UseContainersOptions {
  instructor_id?: string;
  container_type?: string;
  is_active?: boolean;
  autoFetch?: boolean;
}

export function useContainers(options: UseContainersOptions = {}) {
  const [containers, setContainers] = useState<ClassContainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadContainers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const filters: any = {};
    if (options.instructor_id) filters.instructor_id = options.instructor_id;
    if (options.container_type) filters.container_type = options.container_type;
    if (options.is_active !== undefined) filters.is_active = options.is_active;

    const { data, error: fetchError } = await fetchContainers(filters);

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    setContainers(data || []);
    setLoading(false);
  }, [options.instructor_id, options.container_type, options.is_active]);

  const createNewContainer = useCallback(
    async (request: CreateContainerRequest, currentUserId: string) => {
      setLoading(true);
      setError(null);

      const { data, error: createError } = await createContainer(request, currentUserId);

      if (createError) {
        setError(createError);
        setLoading(false);
        return { success: false, error: createError };
      }

      // Reload containers after creation
      await loadContainers();

      setLoading(false);
      return { success: true, data, error: null };
    },
    [loadContainers]
  );

  const updateCapacity = useCallback(
    async (request: UpdateContainerCapacityRequest) => {
      setLoading(true);
      setError(null);

      const { success, error: updateError } = await updateContainerCapacity(request);

      if (!success || updateError) {
        setError(updateError);
        setLoading(false);
        return { success: false, error: updateError };
      }

      // Reload containers after update
      await loadContainers();

      setLoading(false);
      return { success: true, error: null };
    },
    [loadContainers]
  );

  const deactivate = useCallback(
    async (containerId: string) => {
      setLoading(true);
      setError(null);

      const { success, error: deactivateError } = await deactivateContainer(containerId);

      if (!success || deactivateError) {
        setError(deactivateError);
        setLoading(false);
        return { success: false, error: deactivateError };
      }

      // Reload containers after deactivation
      await loadContainers();

      setLoading(false);
      return { success: true, error: null };
    },
    [loadContainers]
  );

  useEffect(() => {
    if (options.autoFetch !== false) {
      loadContainers();
    }
  }, [loadContainers, options.autoFetch]);

  return {
    containers,
    loading,
    error,
    reload: loadContainers,
    createNewContainer,
    updateCapacity,
    deactivate
  };
}
