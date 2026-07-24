-- Floof Sudoku — stats storage
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).

create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row-level security: each signed-in user can only read their own row.
-- Writes go through security definer RPCs (upsert_user_stats, award_game_bones, …).
alter table public.user_data enable row level security;

drop policy if exists "read own data" on public.user_data;
create policy "read own data"
  on public.user_data for select
  using (auth.uid() = user_id);

drop policy if exists "insert own data" on public.user_data;
drop policy if exists "update own data" on public.user_data;

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

-- Own results readable; friends-read policy is added in friends.sql / security_hardening.sql.
-- Writes go through submit_daily_result RPC only.
drop policy if exists "read all daily results" on public.daily_results;
drop policy if exists "read own daily results" on public.daily_results;
create policy "read own daily results"
  on public.daily_results for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "insert own daily result" on public.daily_results;
drop policy if exists "update own daily result" on public.daily_results;

-- Index for fast daily leaderboard queries.
create index if not exists daily_results_date_idx on public.daily_results (puzzle_date);

-- Submit daily result (server verifies board in /api/daily/submit, then calls this).
create or replace function public.submit_daily_result(
  p_date date,
  p_elapsed integer,
  p_mistakes integer,
  p_solved boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing record;
  elapsed int;
  mistakes int;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  mistakes := least(greatest(coalesce(p_mistakes, 0), 0), 10);
  elapsed := least(greatest(coalesce(p_elapsed, 0), 0), 86400);

  if not p_solved then
    elapsed := 0;
  end if;

  select * into existing
  from public.daily_results
  where user_id = uid and puzzle_date = p_date;

  if found then
    if existing.solved and not p_solved then
      return jsonb_build_object('ok', true, 'kept', true);
    end if;
    if existing.solved and p_solved and existing.elapsed_seconds <= elapsed then
      return jsonb_build_object('ok', true, 'kept', true);
    end if;
  end if;

  insert into public.daily_results as dr (
    user_id, puzzle_date, elapsed_seconds, mistakes, solved, completed_at
  ) values (
    uid, p_date, elapsed, mistakes, coalesce(p_solved, false), now()
  )
  on conflict (user_id, puzzle_date) do update set
    elapsed_seconds = excluded.elapsed_seconds,
    mistakes = excluded.mistakes,
    solved = excluded.solved,
    completed_at = excluded.completed_at;

  return jsonb_build_object('ok', true, 'kept', false);
end;
$$;

revoke all on function public.submit_daily_result(date, integer, integer, boolean) from public;
grant execute on function public.submit_daily_result(date, integer, integer, boolean) to authenticated;

-- Bone wallet / purchases (authoritative balance): also run wallet.sql
-- for purchase_exclusive_dog, award_game_bones, and upsert_user_stats RPCs.
-- Then run security_hardening.sql on existing projects.
