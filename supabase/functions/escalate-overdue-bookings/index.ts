// ============================================================================
// EDGE FUNCTION: escalate-overdue-bookings
// ============================================================================
// Purpose: Daily cron to escalate booking access_status based on overdue payments
// Schedule: Daily at 6 AM UTC
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify cron secret (optional security)
    const authHeader = req.headers.get('authorization')
    const cronSecret = Deno.env.get('CRON_SECRET')
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting escalation check...')

    // Call the database function to escalate overdue bookings
    const { data, error } = await supabase.rpc('escalate_overdue_bookings')

    if (error) {
      console.error('Error escalating bookings:', error)
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          details: error
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    console.log('Escalation completed:', data)

    // Log summary
    console.log(`✅ Escalated to grace: ${data.escalated_to_grace}`)
    console.log(`🔒 Escalated to locked: ${data.escalated_to_locked}`)
    console.log(`✨ Restored to active: ${data.restored_to_active}`)
    console.log(`➡️ No change: ${data.no_change}`)
    console.log(`📊 Total processed: ${data.total_processed}`)

    return new Response(
      JSON.stringify({
        success: true,
        execution_time: new Date().toISOString(),
        ...data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
