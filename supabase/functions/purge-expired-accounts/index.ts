import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-purge-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  }

  const purgeSecret = Deno.env.get('ACCOUNT_PURGE_SECRET');
  if (!purgeSecret || request.headers.get('x-purge-secret') !== purgeSecret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: 'Server Supabase configuration is incomplete' }, { status: 500, headers: corsHeaders });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: expired, error: queryError } = await admin
    .from('user_data')
    .select('user_id')
    .not('scheduled_delete_at', 'is', null)
    .lte('scheduled_delete_at', new Date().toISOString());
  if (queryError) {
    console.error('Could not load expired account deletion requests:', queryError);
    return Response.json({ error: 'Could not load expired deletion requests' }, { status: 500, headers: corsHeaders });
  }

  const deleted: string[] = [];
  const failures: string[] = [];
  for (const account of expired ?? []) {
    const { error } = await admin.auth.admin.deleteUser(account.user_id);
    if (error) {
      console.error(`Could not delete expired account ${account.user_id}:`, error);
      failures.push(account.user_id);
    } else {
      deleted.push(account.user_id);
    }
  }

  return Response.json({ deleted: deleted.length, failures }, { headers: corsHeaders });
});
