import { useQuery } from '@tanstack/react-query';
import { assignmentService } from '../../../../services/v2';
import type { Assignment } from '../types/assignment.types';

/**
 * Hook: useAssignments
 * TODO: support date range and status filters
 */
export const useAssignments = (params: Record<string, any> = {}) => {
  const { enabled = true, ...filterParams } = params;

  const query = useQuery({
    queryKey: ['assignments', filterParams],
    queryFn: async () => {
      const result = await assignmentService.listAssignments(filterParams as any);
      if (!result.success) throw new Error(result.error?.message || 'Failed to fetch assignments');
      return result.data;
    },
    enabled: !!params?.containerId && enabled,
    staleTime: 15 * 1000,
    cacheTime: 2 * 60 * 1000,
  });

  return {
    assignments: (query.data as Assignment[]) || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
};
