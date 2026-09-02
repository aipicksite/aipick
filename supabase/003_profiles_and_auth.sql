-- Profiles (registration/login finalization) — run after 001 and 002.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "Profiles are publicly readable" on profiles;
create policy "Profiles are publicly readable" on profiles
  for select using (true);

drop policy if exists "Users update their own profile" on profiles;
create policy "Users update their own profile" on profiles
  for update using (auth.uid() = id);

drop policy if exists "Users insert their own profile" on profiles;
create policy "Users insert their own profile" on profiles
  for insert with check (auth.uid() = id);

-- Auto-create a profile row the moment someone signs up / signs in for the
-- first time, using a default username derived from their email.
create or replace function handle_new_user() returns trigger as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]+', '', 'g'));
  if base_username is null or base_username = '' then
    base_username := 'user';
  end if;

  final_username := base_username;
  while exists (select 1 from profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  end loop;

  insert into profiles (id, username) values (new.id, final_username)
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Admins (name is what admins.md / requireAdmin() expects — one row per admin email)
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;
-- No public policies: only the service-role / server queries (via requireAdmin) read this table.
