alter table public.user_data
  add column if not exists owner_email text;

alter table public.user_data
  drop constraint if exists user_data_user_id_fkey;

update public.user_data as user_data
set owner_email = lower(auth_user.email)
from auth.users as auth_user
where user_data.user_id = auth_user.id
  and user_data.scheduled_delete_at is not null
  and user_data.owner_email is null
  and auth_user.email is not null;

delete from auth.users as auth_user
using public.user_data as user_data
where user_data.user_id = auth_user.id
  and user_data.scheduled_delete_at is not null;

create index if not exists user_data_scheduled_owner_email_idx
  on public.user_data (lower(owner_email))
  where scheduled_delete_at is not null;

create or replace function public.restore_scheduled_user_data()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if new.email is null or new.email_confirmed_at is null then
    return new;
  end if;

  update public.user_data
  set user_id = new.id,
      owner_email = null,
      deletion_requested_at = null,
      scheduled_delete_at = null,
      updated_at = now()
  where lower(owner_email) = lower(new.email)
    and scheduled_delete_at > now();

  return new;
end;
$$;

revoke all on function public.restore_scheduled_user_data() from public, anon, authenticated;

drop trigger if exists restore_user_data_after_signup on auth.users;
create trigger restore_user_data_after_signup
  after insert or update of email_confirmed_at on auth.users
  for each row
  execute function public.restore_scheduled_user_data();
