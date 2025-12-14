import { createClient } from '@supabase/supabase-js';
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
export async function isApprovedDeveloper() {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid)
        return false;
    const { data, error } = await supabase
        .from('devtools_developers')
        .select('user_id')
        .eq('user_id', uid)
        .limit(1);
    if (error)
        return false;
    return !!(data && data.length > 0);
}
