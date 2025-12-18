import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    console.log('Starting role update process...');
    // Create Supabase client
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: {
        persistSession: false
      }
    });
    // Get and verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Invalid authentication');
    }
    console.log('User authenticated:', user.id);
    // Parse request body
    const { user_id, user_roles } = await req.json();
    if (!user_id || !Array.isArray(user_roles)) {
      throw new Error('Invalid request data - user_id and user_roles array required');
    }
    console.log('Updating roles for user:', user_id, 'New roles:', user_roles);
    // Use the SECURITY DEFINER function to update roles
    const { data, error } = await supabaseAdmin.rpc('admin_update_user_roles', {
      target_user_id: user_id,
      new_role_names: user_roles,
      requesting_user_id: user.id
    });
    if (error) {
      console.error('RPC error:', error);
      throw new Error(`Failed to update user roles: ${error.message}`);
    }
    console.log('Roles updated successfully:', data);
    return new Response(JSON.stringify({
      success: true,
      message: 'Roles updated successfully',
      data: data
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      details: error.stack
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
