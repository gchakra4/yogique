import { createClient } from 'jsr:@supabase/supabase-js@^2';
Deno.serve(async (req)=>{
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405
    });
  }
  const { user_id, role_id, assigned_by } = await req.json();
  if (!user_id || !role_id || !assigned_by) {
    return new Response('Missing required fields', {
      status: 400
    });
  }
  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'), {
    global: {
      headers: {
        Authorization: req.headers.get('Authorization') || ''
      }
    }
  });
  const { error } = await supabase.from('user_roles').insert({
    user_id,
    role_id,
    assigned_by
  });
  if (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  return new Response(JSON.stringify({
    success: true
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
});
