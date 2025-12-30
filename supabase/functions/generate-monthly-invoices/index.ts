// ============================================================================
// EDGE FUNCTION: generate-monthly-invoices
// ============================================================================
// Purpose: Cron job to generate monthly invoices (days 23-27)
// Schedule: Daily at midnight UTC, only executes on days 23-27
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvoiceGenerationResult {
  success: boolean
  target_month?: string
  billing_period_start?: string
  billing_period_end?: string
  due_date?: string
  created_count?: number
  skipped_count?: number
  error_count?: number
  errors?: Array<{ booking_id: string; error: string }>
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get current day of month
    const now = new Date()
    const dayOfMonth = now.getUTCDate()

    // Only run on days 23-27 of each month
    if (dayOfMonth < 23 || dayOfMonth > 27) {
      console.log(`Skipping execution - current day is ${dayOfMonth} (only runs days 23-27)`)
      return new Response(
        JSON.stringify({
          success: true,
          message: `Skipped - not in execution window (day ${dayOfMonth})`,
          execution_window: '23-27 of each month'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Verify cron secret (if provided)
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

    console.log(`Generating monthly invoices for next month (day ${dayOfMonth})...`)

    // Call the database function to generate invoices
    // Note: target_month defaults to next month if NULL
    const { data, error } = await supabase.rpc('generate_monthly_invoices', {
      p_target_month: null // Auto-calculate next month
    })

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

    const result = data as InvoiceGenerationResult

    console.log('Invoice generation completed:', result)

    // Log summary
    if (result.success) {
      console.log(`✅ Created: ${result.created_count}, Skipped: ${result.skipped_count}, Errors: ${result.error_count}`)
      
      if (result.error_count && result.error_count > 0) {
        console.error('Errors occurred:', result.errors)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        day_of_month: dayOfMonth,
        execution_time: now.toISOString(),
        ...result
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
