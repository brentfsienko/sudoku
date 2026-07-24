-- Security hardening migration (run in Supabase SQL editor after prior schemas).
-- REQUIRED on existing projects for these app changes to take effect.
-- Makes wallet RPCs authoritative, hardens daily/friends/trivia policies.

-- ─── 1. user_data: revoke direct client writes ───────────────────────────────
drop policy if exists "insert own data" on public.user_data;
drop policy if exists "update own data" on public.user_data;
-- Keep SELECT so clients can read their row.
-- Inserts/updates go only through security definer RPCs.

-- ─── 2. upsert_user_stats: never accept client wallet on first insert ───────
create or replace function public.upsert_user_stats(p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing jsonb;
  merged jsonb;
  safe jsonb;
  bones_val jsonb;
  owned_val jsonb;
  bones_at_val jsonb;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  -- Strip wallet fields from client payload always.
  safe := coalesce(p_data, '{}'::jsonb)
    - 'bones'
    - 'ownedExclusiveDogs'
    - 'bonesUpdatedAt';

  select data into existing from public.user_data where user_id = uid for update;

  if existing is null then
    safe := jsonb_set(safe, '{bones}', '0'::jsonb);
    safe := jsonb_set(safe, '{ownedExclusiveDogs}', '[]'::jsonb);
    insert into public.user_data (user_id, data, updated_at)
    values (uid, safe, now())
    returning data into merged;
    return merged;
  end if;

  merged := safe;
  bones_val := existing -> 'bones';
  owned_val := existing -> 'ownedExclusiveDogs';
  bones_at_val := existing -> 'bonesUpdatedAt';

  if bones_val is not null then
    merged := jsonb_set(merged, '{bones}', bones_val);
  else
    merged := jsonb_set(merged, '{bones}', '0'::jsonb);
  end if;
  if owned_val is not null then
    merged := jsonb_set(merged, '{ownedExclusiveDogs}', owned_val);
  else
    merged := jsonb_set(merged, '{ownedExclusiveDogs}', '[]'::jsonb);
  end if;
  if bones_at_val is not null then
    merged := jsonb_set(merged, '{bonesUpdatedAt}', bones_at_val);
  end if;

  -- finishedSoloIds only grow via award_game_bones — never trust the client list.
  if existing ? 'finishedSoloIds' then
    merged := jsonb_set(merged, '{finishedSoloIds}', existing -> 'finishedSoloIds');
  elsif merged ? 'finishedSoloIds' then
    merged := merged - 'finishedSoloIds';
  end if;

  update public.user_data
  set data = merged, updated_at = now()
  where user_id = uid
  returning data into merged;

  return merged;
end;
$$;

revoke all on function public.upsert_user_stats(jsonb) from public;
grant execute on function public.upsert_user_stats(jsonb) to authenticated;

-- ─── 3. award_game_bones: capped + deduped by game id ───────────────────────
-- Replaces unbounded add_bones for gameplay awards.
create or replace function public.award_game_bones(
  p_game_id text,
  p_amount integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  d jsonb;
  bones int;
  finished jsonb;
  already boolean;
  amt int;
  max_per_game constant int := 20;
  max_finished constant int := 200;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if p_game_id is null or length(trim(p_game_id)) < 4 or length(p_game_id) > 80 then
    raise exception 'invalid game id';
  end if;

  amt := least(greatest(coalesce(p_amount, 0), 0), max_per_game);

  select data into d from public.user_data where user_id = uid for update;

  if d is null then
    d := jsonb_build_object(
      'bones', 0,
      'ownedExclusiveDogs', '[]'::jsonb,
      'finishedSoloIds', '[]'::jsonb
    );
    insert into public.user_data (user_id, data, updated_at)
    values (uid, d, now());
    select data into d from public.user_data where user_id = uid for update;
  end if;

  finished := coalesce(d -> 'finishedSoloIds', '[]'::jsonb);
  already := exists (
    select 1 from jsonb_array_elements_text(finished) as x(v) where x.v = p_game_id
  );

  if already then
    return jsonb_build_object(
      'bones', coalesce((d->>'bones')::int, 0),
      'ownedExclusiveDogs', coalesce(d->'ownedExclusiveDogs', '[]'::jsonb),
      'awarded', false
    );
  end if;

  bones := coalesce((d->>'bones')::int, 0) + amt;
  finished := finished || jsonb_build_array(p_game_id);
  -- Bound finished id list
  if jsonb_array_length(finished) > max_finished then
    finished := (
      select coalesce(jsonb_agg(elem), '[]'::jsonb)
      from (
        select elem
        from jsonb_array_elements(finished) with ordinality as t(elem, ord)
        order by ord desc
        limit max_finished
      ) s
    );
  end if;

  d := jsonb_set(d, '{bones}', to_jsonb(bones));
  d := jsonb_set(d, '{finishedSoloIds}', finished);
  d := jsonb_set(d, '{bonesUpdatedAt}', to_jsonb((extract(epoch from now()) * 1000)::bigint));

  update public.user_data
  set data = d, updated_at = now()
  where user_id = uid;

  return jsonb_build_object(
    'bones', bones,
    'ownedExclusiveDogs', coalesce(d->'ownedExclusiveDogs', '[]'::jsonb),
    'awarded', amt > 0
  );
end;
$$;

revoke all on function public.award_game_bones(text, integer) from public;
grant execute on function public.award_game_bones(text, integer) to authenticated;

-- Cap legacy add_bones: positive amounts must use award_game_bones.
create or replace function public.add_bones(p_amount integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  d jsonb;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if p_amount is not null and p_amount > 0 then
    raise exception 'use award_game_bones';
  end if;
  select data into d from public.user_data where user_id = uid;
  return jsonb_build_object(
    'bones', coalesce((d->>'bones')::int, 0),
    'ownedExclusiveDogs', coalesce(d->'ownedExclusiveDogs', '[]'::jsonb)
  );
end;
$$;

revoke all on function public.add_bones(integer) from public;
grant execute on function public.add_bones(integer) to authenticated;

-- ─── 4. daily_results: friends-only read + RPC submit ───────────────────────
drop policy if exists "read all daily results" on public.daily_results;
drop policy if exists "read own daily results" on public.daily_results;
drop policy if exists "read friends daily results" on public.daily_results;
drop policy if exists "insert own daily result" on public.daily_results;
drop policy if exists "update own daily result" on public.daily_results;

create policy "read own daily results"
  on public.daily_results for select
  to authenticated
  using (auth.uid() = user_id);

create policy "read friends daily results"
  on public.daily_results for select
  to authenticated
  using (
    exists (
      select 1 from public.friend_requests fr
      where fr.status = 'accepted'
        and (
          (fr.from_user_id = auth.uid() and fr.to_user_id = daily_results.user_id)
          or (fr.to_user_id = auth.uid() and fr.from_user_id = daily_results.user_id)
        )
    )
  );

-- No direct insert/update — use submit_daily_result RPC (called after server verify).

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

-- ─── 5. Friends / invites: column-level update + friendship gate ────────────
revoke update on table public.friend_requests from authenticated;
grant update (status) on table public.friend_requests to authenticated;

revoke update on table public.game_invites from authenticated;
grant update (status) on table public.game_invites to authenticated;

create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friend_requests fr
    where fr.status = 'accepted'
      and (
        (fr.from_user_id = a and fr.to_user_id = b)
        or (fr.from_user_id = b and fr.to_user_id = a)
      )
  );
$$;

revoke all on function public.are_friends(uuid, uuid) from public;
grant execute on function public.are_friends(uuid, uuid) to authenticated;

drop policy if exists "game_invites insert host" on public.game_invites;
create policy "game_invites insert host"
  on public.game_invites for insert
  to authenticated
  with check (
    auth.uid() = host_id
    and host_id <> guest_id
    and public.are_friends(host_id, guest_id)
  );

-- ─── 6. Trivia: authenticated only ──────────────────────────────────────────
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
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_fact_id is null or length(p_fact_id) < 1 or length(p_fact_id) > 80 then
    raise exception 'invalid fact id';
  end if;

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

revoke all on function public.record_trivia_guess(text, boolean) from public;
revoke all on function public.record_trivia_guess(text, boolean) from anon;
grant execute on function public.record_trivia_guess(text, boolean) to authenticated;
