-- App-wide trivia guess stats (run once in Supabase SQL editor).
-- Without this, the app falls back to per-device local aggregates.

create table if not exists public.trivia_stats (
  id text primary key default 'global',
  correct bigint not null default 1247,
  wrong bigint not null default 892,
  updated_at timestamptz not null default now()
);

insert into public.trivia_stats (id, correct, wrong)
values ('global', 1247, 892)
on conflict (id) do nothing;

alter table public.trivia_stats enable row level security;

drop policy if exists "anyone read trivia stats" on public.trivia_stats;
create policy "anyone read trivia stats"
  on public.trivia_stats for select
  using (true);

create or replace function public.record_trivia_guess(was_correct boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.trivia_stats (id, correct, wrong)
  values ('global', case when was_correct then 1 else 0 end, case when was_correct then 0 else 1 end)
  on conflict (id) do update set
    correct = trivia_stats.correct + case when was_correct then 1 else 0 end,
    wrong = trivia_stats.wrong + case when was_correct then 0 else 1 end,
    updated_at = now();
end;
$$;

grant execute on function public.record_trivia_guess(boolean) to anon, authenticated;
