import { createClient } from '@supabase/supabase-js';
// Prefer runtime-injected config (from /config.js) when present, otherwise use build-time Vite envs.
const runtimeConfig = typeof window !== 'undefined' ? window.DEVTOOLS_CONFIG || {} : {};
const getHost = () => {
    if (typeof window !== 'undefined' && window.location)
        return window.location.hostname;
    return 'yogique.life';
};
const host = getHost();
const isProdHost = host === 'yogique.life';
// Resolve URL/key order:
// 1. runtime-injected window vars
// 2. explicit VITE_SUPABASE_URL/_ANON_KEY (legacy)
// 3. per-context VITE_SUPABASE_URL_PROD / VITE_SUPABASE_URL_DEV (new)
const runtimeUrl = (typeof window !== 'undefined' && (window.SUPABASE_URL || runtimeConfig.SUPABASE_URL));
const runtimeAnon = (typeof window !== 'undefined' && (window.SUPABASE_ANON_KEY || runtimeConfig.SUPABASE_ANON_KEY));
const supabaseUrl = runtimeUrl
    || import.meta.env.VITE_SUPABASE_URL
    || (isProdHost ? import.meta.env.VITE_SUPABASE_URL_PROD : import.meta.env.VITE_SUPABASE_URL_DEV);
const supabaseAnonKey = runtimeAnon
    || import.meta.env.VITE_SUPABASE_ANON_KEY
    || (isProdHost ? import.meta.env.VITE_SUPABASE_ANON_PROD : import.meta.env.VITE_SUPABASE_ANON_DEV);
// Runtime guard to surface misconfiguration
if (!supabaseUrl || !supabaseUrl.includes('.supabase.co')) {
    console.warn('[Supabase Config] VITE_SUPABASE_URL is invalid or missing:', supabaseUrl, 'Expected something like https://<project-ref>.supabase.co.');
}
if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
    console.warn('[Supabase Config] VITE_SUPABASE_ANON_KEY looks missing/short. Auth will fail.');
}
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');
export const SUPABASE_URL = supabaseUrl ?? '';
export const SUPABASE_ANON_KEY = supabaseAnonKey ?? '';
