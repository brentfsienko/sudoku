-- Friends, searchable profiles, and game invites
-- Run in Supabase SQL Editor after schema.sql
--
-- Uses player_profiles (not "profiles") — Supabase projects often already have
-- a public.profiles table from auth templates without a username column.

create table if not exists public.player_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text not null, -- mirrors username (legacy column)
  dog_id text not null default 'golden',
  updated_at timestamptz not null default now(),
  constraint player_profiles_username_len check (char_length(username) >= 3 and char_length(username) <= 24),
  constraint player_profiles_username_format check (username ~ '^[a-z0-9_]+$')
);

create unique index if not exists player_profiles_username_lower_idx
  on public.player_profiles (lower(username));

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users (id) on delete cascade,
  to_user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (from_user_id, to_user_id),
  check (from_user_id <> to_user_id)
);

create table if not exists public.game_invites (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  host_id uuid not null references auth.users (id) on delete cascade,
  guest_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('coop', 'competitive')),
  difficulty text not null,
  status text not null default 'pending'
    check (status in ('pending', 'joined', 'expired')),
  created_at timestamptz not null default now()
);

create index if not exists game_invites_guest_pending_idx
  on public.game_invites (guest_id, status)
  where status = 'pending';

alter table public.player_profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.game_invites enable row level security;

-- Player profiles
drop policy if exists "player_profiles read all" on public.player_profiles;
create policy "player_profiles read all"
  on public.player_profiles for select
  to authenticated
  using (true);

drop policy if exists "player_profiles insert own" on public.player_profiles;
create policy "player_profiles insert own"
  on public.player_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "player_profiles update own" on public.player_profiles;
create policy "player_profiles update own"
  on public.player_profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Friend requests
drop policy if exists "friend_requests read involved" on public.friend_requests;
create policy "friend_requests read involved"
  on public.friend_requests for select
  to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

drop policy if exists "friend_requests insert sender" on public.friend_requests;
create policy "friend_requests insert sender"
  on public.friend_requests for insert
  to authenticated
  with check (auth.uid() = from_user_id and from_user_id <> to_user_id);

drop policy if exists "friend_requests update receiver" on public.friend_requests;
create policy "friend_requests update receiver"
  on public.friend_requests for update
  to authenticated
  using (auth.uid() = to_user_id)
  with check (auth.uid() = to_user_id);

drop policy if exists "friend_requests delete involved" on public.friend_requests;
create policy "friend_requests delete involved"
  on public.friend_requests for delete
  to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- Game invites
drop policy if exists "game_invites read involved" on public.game_invites;
create policy "game_invites read involved"
  on public.game_invites for select
  to authenticated
  using (auth.uid() = host_id or auth.uid() = guest_id);

drop policy if exists "game_invites insert host" on public.game_invites;
create policy "game_invites insert host"
  on public.game_invites for insert
  to authenticated
  with check (auth.uid() = host_id and host_id <> guest_id);

drop policy if exists "game_invites update guest" on public.game_invites;
create policy "game_invites update guest"
  on public.game_invites for update
  to authenticated
  using (auth.uid() = guest_id)
  with check (auth.uid() = guest_id);
