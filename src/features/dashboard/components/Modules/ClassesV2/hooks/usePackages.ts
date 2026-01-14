import { useQuery, useQueryClient } from '@tanstack/react-query';
import { packageService } from '../../../../services/v2';
import type { Package } from '../types/package.types';

/**
 * Hook: usePackages
 * TODO: wire up types and add clearCache usage where package mutations occur
 */
export const usePackages = (params: Record<string, any> = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['packages', params],
    queryFn: async () => {
      const result = await packageService.listPackages({ ...params, useCache: true } as any);
      if (!result.success) throw new Error(result.error?.message || 'Failed to fetch packages');
      return result.data;
    },
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const clearCache = () => {
    packageService.clearCache();
    queryClient.invalidateQueries(['packages']);
  };

  return {
    packages: (query.data as Package[]) || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    clearCache,
  };
};
