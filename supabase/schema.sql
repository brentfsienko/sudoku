-- Floof Sudoku — stats storage
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).

create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row-level security: each signed-in user can only read/write their own row.
alter table public.user_data enable row level security;

drop policy if exists "read own data" on public.user_data;
create policy "read own data"
  on public.user_data for select
  using (auth.uid() = user_id);

drop policy if exists "insert own data" on public.user_data;
create policy "insert own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "update own data" on public.user_data;
create policy "update own data"
  on public.user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
