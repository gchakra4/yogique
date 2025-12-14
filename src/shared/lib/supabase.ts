import { createClient } from '@supabase/supabase-js'

// Prefer runtime-injected config (from /config.js) when present, otherwise use build-time Vite envs
const runtimeConfig = typeof window !== 'undefined' ? (window as any).DEVTOOLS_CONFIG || {} : {}
const supabaseUrl = (typeof window !== 'undefined' && ((window as any).SUPABASE_URL || runtimeConfig.SUPABASE_URL)) || import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = (typeof window !== 'undefined' && ((window as any).SUPABASE_ANON_KEY || runtimeConfig.SUPABASE_ANON_KEY)) || import.meta.env.VITE_SUPABASE_ANON_KEY

// Runtime guard to surface the misconfiguration causing 404 on /auth/v1/authorize
if (!supabaseUrl || !supabaseUrl.includes('.supabase.co')) {
    // This will appear in production console to highlight wrong env wiring
    console.warn(
        '[Supabase Config] VITE_SUPABASE_URL is invalid or missing:',
        supabaseUrl,
        'Expected something like https://<project-ref>.supabase.co. ' +
        'If you see your site origin here (https://yogique.life) your Netlify env var names are wrong (must be VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) and you must redeploy.'
    )
}

if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
    console.warn('[Supabase Config] VITE_SUPABASE_ANON_KEY looks missing/short. Auth will fail.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

