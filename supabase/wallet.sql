-- Authoritative bone wallet + purchases (run in Supabase SQL editor).
-- Stats blob upserts must not clobber bones / ownedExclusiveDogs — those
-- are only changed by add_bones / purchase_exclusive_dog.

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
  bones_val jsonb;
  owned_val jsonb;
  bones_at_val jsonb;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select data into existing from public.user_data where user_id = uid for update;

  if existing is null then
    insert into public.user_data (user_id, data, updated_at)
    values (uid, coalesce(p_data, '{}'::jsonb), now())
    returning data into merged;
    return merged;
  end if;

  -- Start from client payload, then lock wallet fields to whatever the server has.
  merged := coalesce(p_data, '{}'::jsonb);
  bones_val := existing -> 'bones';
  owned_val := existing -> 'ownedExclusiveDogs';
  bones_at_val := existing -> 'bonesUpdatedAt';

  if bones_val is not null then
    merged := jsonb_set(merged, '{bones}', bones_val);
  end if;
  if owned_val is not null then
    merged := jsonb_set(merged, '{ownedExclusiveDogs}', owned_val);
  end if;
  if bones_at_val is not null then
    merged := jsonb_set(merged, '{bonesUpdatedAt}', bones_at_val);
  elsif merged ? 'bonesUpdatedAt' then
    merged := merged - 'bonesUpdatedAt';
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

-- Award bones from gameplay (atomic increment).
create or replace function public.add_bones(p_amount integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  d jsonb;
  bones int;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if p_amount is null or p_amount <= 0 then
    select data into d from public.user_data where user_id = uid;
    return jsonb_build_object(
      'bones', coalesce((d->>'bones')::int, 0),
      'ownedExclusiveDogs', coalesce(d->'ownedExclusiveDogs', '[]'::jsonb)
    );
  end if;

  select data into d from public.user_data where user_id = uid for update;

  if d is null then
    d := jsonb_build_object(
      'bones', p_amount,
      'ownedExclusiveDogs', '[]'::jsonb,
      'bonesUpdatedAt', (extract(epoch from now()) * 1000)::bigint
    );
    insert into public.user_data (user_id, data, updated_at)
    values (uid, d, now());
    return jsonb_build_object(
      'bones', p_amount,
      'ownedExclusiveDogs', '[]'::jsonb
    );
  end if;

  bones := coalesce((d->>'bones')::int, 0) + p_amount;
  d := jsonb_set(d, '{bones}', to_jsonb(bones));
  d := jsonb_set(d, '{bonesUpdatedAt}', to_jsonb((extract(epoch from now()) * 1000)::bigint));

  update public.user_data
  set data = d, updated_at = now()
  where user_id = uid;

  return jsonb_build_object(
    'bones', bones,
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
