-- Authoritative bone wallet + purchases (run in Supabase SQL editor).
-- Stats blob upserts must not clobber bones / ownedExclusiveDogs — those
-- are only changed by award_game_bones / purchase_exclusive_dog.
-- Also run security_hardening.sql to revoke direct user_data writes.

-- Upsert gameplay stats while preserving the server wallet fields.
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

-- Award bones for a finished game (capped + deduped by game id).
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

-- Legacy read-only stub (positive awards must use award_game_bones).
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

-- Buy an exclusive pup (atomic debit + ownership).
create or replace function public.purchase_exclusive_dog(p_dog text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  d jsonb;
  bones int;
  owned jsonb;
  cost int;
  already boolean;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  cost := case p_dog
    when 'royal' then 50
    when 'hero' then 100
    when 'party' then 150
    when 'galaxy' then 250
    else null
  end;
  if cost is null then
    return jsonb_build_object('ok', false, 'error', 'Invalid pup.');
  end if;

  select data into d from public.user_data where user_id = uid for update;

  if d is null then
    d := jsonb_build_object('bones', 0, 'ownedExclusiveDogs', '[]'::jsonb);
    insert into public.user_data (user_id, data, updated_at)
    values (uid, d, now());
    select data into d from public.user_data where user_id = uid for update;
  end if;

  bones := coalesce((d->>'bones')::int, 0);
  owned := coalesce(d->'ownedExclusiveDogs', '[]'::jsonb);
  already := exists (
    select 1 from jsonb_array_elements_text(owned) as x(v) where x.v = p_dog
  );

  if already then
    return jsonb_build_object(
      'ok', true,
      'alreadyOwned', true,
      'bones', bones,
      'ownedExclusiveDogs', owned
    );
  end if;

  if bones < cost then
    return jsonb_build_object(
      'ok', false,
      'error', 'Need more bones.',
      'bones', bones,
      'ownedExclusiveDogs', owned
    );
  end if;

  bones := bones - cost;
  owned := owned || jsonb_build_array(p_dog);
  d := jsonb_set(d, '{bones}', to_jsonb(bones));
  d := jsonb_set(d, '{ownedExclusiveDogs}', owned);
  d := jsonb_set(d, '{bonesUpdatedAt}', to_jsonb((extract(epoch from now()) * 1000)::bigint));

  update public.user_data
  set data = d, updated_at = now()
  where user_id = uid;

  return jsonb_build_object(
    'ok', true,
    'alreadyOwned', false,
    'bones', bones,
    'ownedExclusiveDogs', owned
  );
end;
$$;

revoke all on function public.purchase_exclusive_dog(text) from public;
grant execute on function public.purchase_exclusive_dog(text) to authenticated;
