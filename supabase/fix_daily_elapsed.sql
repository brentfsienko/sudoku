-- Fix: allow verified daily solves under 15s onto the leaderboard.
-- Board verification in /api/daily/submit is the anti-cheat; the elapsed floor
-- falsely rejected fast legitimate solves while local UI still showed "done".
--
-- Run in Supabase SQL editor (safe to re-run).

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
