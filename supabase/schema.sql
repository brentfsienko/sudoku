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

-- Daily challenge results — one row per (user, date).
-- Times are stored in seconds; puzzle_date is the PST calendar date.
-- solved=false means the user ran out of hearts (elapsed_seconds is ignored for ranking).
create table if not exists public.daily_results (
  user_id         uuid    not null references auth.users (id) on delete cascade,
  puzzle_date     date    not null,
  elapsed_seconds integer not null default 0,
  mistakes        integer not null default 0,
  solved          boolean not null default true,
  completed_at    timestamptz not null default now(),
  primary key (user_id, puzzle_date)
);

-- Migration for existing tables (safe to run multiple times):
-- alter table public.daily_results add column if not exists solved boolean not null default true;

alter table public.daily_results enable row level security;

-- Anyone can read daily results (only elapsed_seconds + mistakes, not sensitive).
drop policy if exists "read all daily results" on public.daily_results;
create policy "read all daily results"
  on public.daily_results for select using (true);

drop policy if exists "insert own daily result" on public.daily_results;
create policy "insert own daily result"
  on public.daily_results for insert
  with check (auth.uid() = user_id);

drop policy if exists "update own daily result" on public.daily_results;
create policy "update own daily result"
  on public.daily_results for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast daily leaderboard queries.
create index if not exists daily_results_date_idx on public.daily_results (puzzle_date);

-- Bone wallet / purchases (authoritative balance): also run wallet.sql
-- for purchase_exclusive_dog, add_bones, and upsert_user_stats RPCs.
