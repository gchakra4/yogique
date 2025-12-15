import { createClient } from '@supabase/supabase-js';
const getHost = () => {
    if (typeof window !== 'undefined' && window.location)
        return window.location.hostname;
    return 'yogique.life';
};
const host = getHost();
const isProdHost = host === 'yogique.life';
const SUPABASE_URL = isProdHost
    ? import.meta.env.VITE_SUPABASE_URL_PROD
    : import.meta.env.VITE_SUPABASE_URL_DEV;
const SUPABASE_ANON = isProdHost
    ? import.meta.env.VITE_SUPABASE_ANON_PROD
    : import.meta.env.VITE_SUPABASE_ANON_DEV;
if (!SUPABASE_URL || !SUPABASE_ANON) {
    // eslint-disable-next-line no-console
    console.warn('Supabase URL or ANON key missing for current environment');
}
export const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_ANON ?? '');
export default supabase;
