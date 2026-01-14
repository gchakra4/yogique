import { useQuery } from '@tanstack/react-query';
import { containerService } from '../../../../services/v2';
import type { Container } from '../types/container.types';

/**
 * Hook: useContainers
 * TODO: add pagination helper, error mapping, and types from service layer
 */
export const useContainers = (params: Record<string, any> = {}) => {
  const { enablePolling = false, pollingInterval = 30000, ...filterParams } = params;

  const query = useQuery({
    queryKey: ['containers', filterParams],
    queryFn: async () => {
      const result = await containerService.listContainers(filterParams as any);
      if (!result.success) throw new Error(result.error?.message || 'Failed to fetch containers');
      return result.data;
    },
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: enablePolling ? pollingInterval : false,
    refetchIntervalInBackground: false,
  });

  return {
    containers: (query.data?.containers as Container[]) || [],
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
};
