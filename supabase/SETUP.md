# Supabase setup

## App credentials and Google OAuth

1. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the Supabase project's API settings. Use the `sb_publishable_...` key; do not use the deprecated `anon` key or put a secret/service-role key in a `VITE_` variable.
2. In Supabase Auth, enable Google and configure the Google OAuth client ID and secret. Add `https://<project-ref>.supabase.co/auth/v1/callback` to the Google OAuth authorized redirect URIs.
3. Add the app's local and deployed origins to Supabase Auth's allowed redirect URLs.

When both app variables are configured, routes require Google sign-in. IndexedDB remains the offline cache. On the first login for an account, local data is imported if the Supabase account has no snapshot; otherwise the cloud snapshot replaces that account's local cache. Future local changes sync to the cloud, and pending writes retry when the browser comes back online.

## Database and Edge Functions

Install the Supabase CLI, then link and deploy the migration and functions:

```sh
supabase login
supabase link --project-ref <project-ref>
supabase db push
supabase functions deploy request-account-deletion
supabase functions deploy purge-expired-accounts
supabase secrets set ACCOUNT_PURGE_SECRET=<long-random-secret>
```

Supabase injects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into Edge Functions. Do not copy the service-role key into the app or source control. The account-deletion function validates the caller's access token using the admin client and does not require the deprecated anon key.

## Schedule account deletion

The app immediately clears this browser's IndexedDB and records a remote deletion request. Supabase blocks normal reads and writes for that account immediately; the Auth user and remote snapshot are permanently deleted after 30 days.

To purge expired requests automatically, enable `pg_cron`, `pg_net`, and Vault in the Supabase project's database extensions. Store the same random value used for `ACCOUNT_PURGE_SECRET` in Vault:

```sql
select vault.create_secret('<same-long-random-secret>', 'account_purge_secret');
```

Then schedule the Edge Function once per day, replacing `<project-ref>`:

```sql
select cron.schedule(
  'purge-expired-accounts',
  '15 3 * * *',
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/purge-expired-accounts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-purge-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'account_purge_secret'
        limit 1
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
```
