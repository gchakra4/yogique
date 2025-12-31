// ============================================================================
// EDGE FUNCTION: generate-t5-invoices
// ============================================================================
// Purpose: Daily cron to generate invoices T-5 days before billing cycle
// Schedule: Daily at midnight UTC
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

    console.log('Starting T-5 invoice generation...')

    // Call the RPC function to generate invoices
    const { data, error } = await supabase.rpc('generate_t5_invoices')

    if (error) {
      console.error('Error generating invoices:', error)
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

    console.log('Invoice generation completed:', data)

    // Log summary
    console.log(`✅ Invoices generated: ${data.total_generated}`)
    console.log(`⏭️ Skipped: ${data.total_skipped}`)
    console.log(`❌ Errors: ${data.total_errors}`)
    console.log(`📊 Total checked: ${data.total_checked}`)

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
