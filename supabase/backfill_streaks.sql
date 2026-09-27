-- Rebuild day streaks from recorded games + daily results (Pacific calendar).
-- Never lowers solo.streak or solo.bestStreak.
-- Run this entire file in the Supabase SQL editor.

begin;

create temporary table if not exists _streak_play_days on commit drop as
select distinct
  ud.user_id,
  (timezone(
    'America/Los_Angeles',
    to_timestamp((h->>'t')::double precision / 1000.0)
  ))::date as d
from public.user_data ud
cross join lateral jsonb_array_elements(coalesce(ud.data->'history', '[]'::jsonb)) h
where (h->>'t') ~ '^[0-9]+(\.[0-9]+)?$'
union
select dr.user_id, dr.puzzle_date
from public.daily_results dr;

create temporary table if not exists _streak_runs on commit drop as
with ordered as (
  select
    user_id,
    d,
    lag(d) over (partition by user_id order by d) as prev
  from _streak_play_days
),
grouped as (
  select
    user_id,
    d,
    sum(case when prev is null or d - prev > 1 then 1 else 0 end)
      over (partition by user_id order by d) as grp
  from ordered
)
select
  user_id,
  grp,
  min(d) as start_d,
  max(d) as end_d,
  count(*)::int as len
from grouped
group by user_id, grp;

create temporary table if not exists _streak_repair on commit drop as
with best as (
  select
    user_id,
    max(len) as best_streak,
    max(end_d) as last_day
  from _streak_runs
  group by user_id
),
trailing as (
  select r.user_id, r.len as streak, r.end_d as last_day
  from _streak_runs r
  join best b on b.user_id = r.user_id and r.end_d = b.last_day
)
select
  ud.user_id,
  coalesce((ud.data->'solo'->>'streak')::int, 0) as old_streak,
  coalesce((ud.data->'solo'->>'bestStreak')::int, 0) as old_best,
  nullif(ud.data->'solo'->>'lastPlayedDate', '') as old_last,
  greatest(
    coalesce((ud.data->'solo'->>'streak')::int, 0),
    coalesce(t.streak, 0)
  ) as new_streak,
  greatest(
    coalesce((ud.data->'solo'->>'bestStreak')::int, 0),
    coalesce(b.best_streak, 0),
    greatest(
      coalesce((ud.data->'solo'->>'streak')::int, 0),
      coalesce(t.streak, 0)
    )
  ) as new_best,
  case
    when t.last_day is null then nullif(ud.data->'solo'->>'lastPlayedDate', '')
    when nullif(ud.data->'solo'->>'lastPlayedDate', '') is null
      then t.last_day::text
    when (ud.data->'solo'->>'lastPlayedDate')::date = t.last_day + 1
      then t.last_day::text
    when (ud.data->'solo'->>'lastPlayedDate')::date < t.last_day
      then t.last_day::text
    else ud.data->'solo'->>'lastPlayedDate'
  end as new_last
from public.user_data ud
left join trailing t on t.user_id = ud.user_id
left join best b on b.user_id = ud.user_id;

-- Preview
select
  u.email,
  r.old_streak,
  r.new_streak,
  r.old_best,
  r.new_best,
  r.old_last,
  r.new_last
from _streak_repair r
join auth.users u on u.id = r.user_id
where
  r.new_streak is distinct from r.old_streak
  or r.new_best is distinct from r.old_best
  or r.new_last is distinct from r.old_last
order by r.new_streak - r.old_streak desc, u.email;

-- Apply
update public.user_data ud
set
  data = jsonb_set(
    jsonb_set(
      jsonb_set(
        coalesce(ud.data, '{}'::jsonb),
        '{solo,streak}',
        to_jsonb(r.new_streak)
      ),
      '{solo,bestStreak}',
      to_jsonb(r.new_best)
    ),
    '{solo,lastPlayedDate}',
    case
      when r.new_last is null then 'null'::jsonb
      else to_jsonb(r.new_last)
    end
  ),
  updated_at = now()
from _streak_repair r
where ud.user_id = r.user_id
  and (
    r.new_streak is distinct from r.old_streak
    or r.new_best is distinct from r.old_best
    or r.new_last is distinct from r.old_last
  );

commit;