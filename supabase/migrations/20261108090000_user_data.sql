create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  deletion_requested_at timestamptz,
  scheduled_delete_at timestamptz,
  constraint user_data_deletion_schedule_check
    check (
      (deletion_requested_at is null and scheduled_delete_at is null)
      or (deletion_requested_at is not null and scheduled_delete_at is not null)
    )
);

alter table public.user_data enable row level security;

create policy "Users can read their active data"
  on public.user_data for select
  to authenticated
  using (auth.uid() = user_id and deletion_requested_at is null);

create policy "Users can insert their own data"
  on public.user_data for insert
  to authenticated
  with check (auth.uid() = user_id and deletion_requested_at is null);

create policy "Users can update their active data"
  on public.user_data for update
  to authenticated
  using (auth.uid() = user_id and deletion_requested_at is null)
  with check (auth.uid() = user_id and deletion_requested_at is null);

create index if not exists user_data_scheduled_delete_at_idx
  on public.user_data (scheduled_delete_at)
  where scheduled_delete_at is not null;
