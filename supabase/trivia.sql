-- Per-fact trivia stats (run in Supabase SQL editor).
-- Replaces the old single global row so today's fact percentages reflect real guesses.

create table if not exists public.trivia_fact_stats (
  fact_id text primary key,
  correct bigint not null default 0,
  wrong bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.trivia_fact_stats enable row level security;

drop policy if exists "anyone read trivia fact stats" on public.trivia_fact_stats;
create policy "anyone read trivia fact stats"
  on public.trivia_fact_stats for select
  using (true);

-- Drop legacy global-only function if present
drop function if exists public.record_trivia_guess(boolean);

create or replace function public.record_trivia_guess(
  p_fact_id text,
  was_correct boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.trivia_fact_stats (fact_id, correct, wrong)
  values (
    p_fact_id,
    case when was_correct then 1 else 0 end,
    case when was_correct then 0 else 1 end
  )
  on conflict (fact_id) do update set
    correct = trivia_fact_stats.correct + case when was_correct then 1 else 0 end,
    wrong = trivia_fact_stats.wrong + case when was_correct then 0 else 1 end,
    updated_at = now();
end;
$$;

grant execute on function public.record_trivia_guess(text, boolean) to anon, authenticated;
