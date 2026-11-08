import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return Response.json({ error: 'Authentication required' }, { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: 'Server Supabase configuration is incomplete' }, { status: 500, headers: corsHeaders });
  }

  const token = authorization.replace(/^Bearer\s+/i, '');
  if (token === authorization) {
    return Response.json({ error: 'Invalid authorization header' }, { status: 401, headers: corsHeaders });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) {
    return Response.json({ error: 'Invalid session' }, { status: 401, headers: corsHeaders });
  }
  if (!user.email) {
    return Response.json({ error: 'Account email is unavailable' }, { status: 400, headers: corsHeaders });
  }

  const { data: existing, error: lookupError } = await admin
    .from('user_data')
    .select('data, deletion_requested_at, scheduled_delete_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (lookupError) {
    console.error('Could not load account data before deletion request:', lookupError);
    return Response.json({ error: 'Could not schedule account deletion' }, { status: 500, headers: corsHeaders });
  }

  let requestedAt: Date;
  let scheduledAt: Date;
  if (existing?.scheduled_delete_at && existing.deletion_requested_at) {
    requestedAt = new Date(existing.deletion_requested_at);
    scheduledAt = new Date(existing.scheduled_delete_at);
  } else {
    requestedAt = new Date();
    scheduledAt = new Date(requestedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const { error: saveError } = await admin.from('user_data').upsert({
      user_id: user.id,
      data: existing?.data ?? {},
      owner_email: user.email.toLowerCase(),
      deletion_requested_at: requestedAt.toISOString(),
      scheduled_delete_at: scheduledAt.toISOString(),
      updated_at: requestedAt.toISOString(),
    });
    if (saveError) {
      console.error('Could not save account deletion request:', saveError);
      return Response.json({ error: 'Could not schedule account deletion' }, { status: 500, headers: corsHeaders });
    }
  }

  const { error: deleteAuthError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteAuthError) {
    console.error('Could not remove Auth user after scheduling account deletion:', deleteAuthError);
    return Response.json({ error: 'Data is scheduled for deletion, but the sign-in identity could not be removed.' }, {
      status: 500,
      headers: corsHeaders,
    });
  }

  return Response.json({
    deletionRequestedAt: requestedAt.toISOString(),
    scheduledDeleteAt: scheduledAt.toISOString(),
  }, { headers: corsHeaders });
});
