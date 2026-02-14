import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../shared/lib/supabase';

export type InstructorOption = {
    id: string;
    name: string;
    email?: string | null;
    raw?: any;
};

type UseInstructorsResult = {
    instructors: InstructorOption[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
};

const toInstructorOption = (row: any): InstructorOption | null => {
    const id: string | undefined = row?.id || row?.user_id || row?.instructor_id;
    if (!id) return null;

    const email: string | null = row?.email ?? null;
    const name: string = (row?.name || row?.full_name || row?.display_name || email || String(id)).toString();

    return {
        id: String(id),
        name,
        email,
        raw: row
    };
};

/**
 * Loads instructor options for admin/assignment UIs.
 * Uses RPC `get_instructors` (preferred) and normalizes returned rows.
 */
export function useInstructors(): UseInstructorsResult {
    const [instructors, setInstructors] = useState<InstructorOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: rpcErr } = await supabase.rpc('get_instructors');
            if (rpcErr) throw rpcErr;

            const mapped = (Array.isArray(data) ? data : [])
                .map(toInstructorOption)
                .filter(Boolean) as InstructorOption[];

            setInstructors(mapped);
        } catch (e: any) {
            setError(e?.message || 'Failed to load instructors');
            setInstructors([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sorted = useMemo(() => {
        return [...instructors].sort((a, b) => a.name.localeCompare(b.name));
    }, [instructors]);

    return { instructors: sorted, loading, error, refetch };
}
