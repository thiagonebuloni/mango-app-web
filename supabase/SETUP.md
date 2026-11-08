# Supabase setup

## App credentials and Google OAuth

1. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the Supabase project's API settings. Use the `sb_publishable_...` key; do not use the deprecated `anon` key or put a secret/service-role key in a `VITE_` variable.
2. In Supabase Auth, enable Email/password sign-ups and configure email confirmation as desired.
3. To enable Google sign-in, configure the Google OAuth client ID and secret. Add `https://<project-ref>.supabase.co/auth/v1/callback` to the Google OAuth authorized redirect URIs.
4. Add the app's local and deployed origins to Supabase Auth's allowed redirect URLs.

The developer-login shortcut is included only in Vite development mode (`import.meta.env.DEV`). It bypasses the app's login gate for local development and uses local browser data only; it is not an authenticated Supabase session and is not included in production builds.

Before users sign in, apply the database migration in the next section. Without the `public.user_data` table, sign-in succeeds but the app cannot connect or sync account data. IndexedDB remains the offline cache. On the first login for an account, local data is imported if the Supabase account has no snapshot; otherwise the cloud snapshot replaces that account's local cache. Future local changes sync to the cloud, and pending writes retry when the browser comes back online.

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

The app immediately clears this browser's IndexedDB and removes the Auth identity, making its email available for registration again. Its remote snapshot is retained but inaccessible and marked for deletion for 30 days. If the owner registers again with the same email and confirms it before the deadline, a database trigger restores the snapshot to the new Auth identity and cancels the scheduled deletion. Otherwise the daily purge permanently removes the snapshot after 30 days.

The reactivation migration also removes Auth identities for deletion requests that were already pending under the previous 30-day-ban behavior, while retaining their snapshots for the remainder of their scheduled period.

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
