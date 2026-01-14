import { useQuery } from '@tanstack/react-query';
import { capacityService } from '../../../../services/v2';

/**
 * Hook: useCapacity
 * TODO: add types for return shape and make polling configurable
 */
export const useCapacity = (containerId: string | null, options: Record<string, any> = {}) => {
  const query = useQuery({
    queryKey: ['capacity', containerId],
    queryFn: async () => {
      if (!containerId) return null;
      const result = await capacityService.getCapacity(containerId);
      if (!result.success) throw new Error(result.error?.message || 'Failed to fetch capacity');
      return result.data;
    },
    enabled: !!containerId && (options.enabled !== false),
    staleTime: 5 * 1000,
    cacheTime: 1 * 60 * 1000,
    refetchInterval: 15 * 1000,
  });

  return {
    capacity: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
};
