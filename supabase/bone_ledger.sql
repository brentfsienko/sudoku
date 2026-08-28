-- Authoritative bone ledger + wallet.
-- Run in the Supabase SQL editor after deploy.
-- Game awards write a ledger row; balance is bone_wallets.balance.
-- user_data.data.bones is kept in sync for existing clients / Realtime.

create table if not exists public.bone_wallets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.bone_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null,
  kind text not null check (kind in ('game', 'purchase', 'adjust')),
  game_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bone_ledger_user_created_idx
  on public.bone_ledger (user_id, created_at desc);

create unique index if not exists bone_ledger_user_game_idx
  on public.bone_ledger (user_id, game_id)
  where game_id is not null;

alter table public.bone_wallets enable row level security;
alter table public.bone_ledger enable row level security;

drop policy if exists "read own bone wallet" on public.bone_wallets;
create policy "read own bone wallet"
  on public.bone_wallets for select
  using (auth.uid() = user_id);

drop policy if exists "read own bone ledger" on public.bone_ledger;
create policy "read own bone ledger"
  on public.bone_ledger for select
  using (auth.uid() = user_id);

revoke insert, update, delete on public.bone_wallets from anon, authenticated;
revoke insert, update, delete on public.bone_ledger from anon, authenticated;
grant select on public.bone_wallets to authenticated;
grant select on public.bone_ledger to authenticated;

-- Backfill wallets from the JSON blob (once). Ledger is not reconstructed.
insert into public.bone_wallets (user_id, balance, updated_at)
select
  user_id,
  greatest(coalesce((data->>'bones')::int, 0), 0),
  now()
from public.user_data
on conflict (user_id) do nothing;

create or replace function public.ensure_bone_wallet(p_uid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  bal int;
  json_bones int;
begin
  select balance into bal from public.bone_wallets where user_id = p_uid for update;
  if found then
    return bal;
  end if;

  select greatest(coalesce((data->>'bones')::int, 0), 0)
    into json_bones
  from public.user_data
  where user_id = p_uid;

  insert into public.bone_wallets (user_id, balance, updated_at)
  values (p_uid, coalesce(json_bones, 0), now())
  on conflict (user_id) do nothing;

  select balance into bal from public.bone_wallets where user_id = p_uid for update;
  return coalesce(bal, 0);
end;
$$;

revoke all on function public.ensure_bone_wallet(uuid) from public;

create or replace function public.sync_user_data_bones(p_uid uuid, p_bones integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  d jsonb;
begin
  select data into d from public.user_data where user_id = p_uid for update;
  if d is null then
    insert into public.user_data (user_id, data, updated_at)
    values (
      p_uid,
      jsonb_build_object(
        'bones', p_bones,
        'ownedExclusiveDogs', '[]'::jsonb,
        'bonesUpdatedAt', (extract(epoch from now()) * 1000)::bigint
      ),
      now()
    );
    return;
  end if;

  d := jsonb_set(d, '{bones}', to_jsonb(p_bones));
  d := jsonb_set(d, '{bonesUpdatedAt}', to_jsonb((extract(epoch from now()) * 1000)::bigint));
  update public.user_data
  set data = d, updated_at = now()
  where user_id = p_uid;
end;
$$;

revoke all on function public.sync_user_data_bones(uuid, integer) from public;

create or replace function public.get_bone_wallet()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  bal int;
  owned jsonb;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  bal := public.ensure_bone_wallet(uid);

  select coalesce(data->'ownedExclusiveDogs', '[]'::jsonb)
    into owned
  from public.user_data
  where user_id = uid;

  return jsonb_build_object(
    'bones', bal,
    'ownedExclusiveDogs', coalesce(owned, '[]'::jsonb),
    'bonesUpdatedAt', (extract(epoch from now()) * 1000)::bigint
  );
end;
$$;

revoke all on function public.get_bone_wallet() from public;
grant execute on function public.get_bone_wallet() to authenticated;

-- Award bones for a finished game. Idempotent per (user, game_id) via ledger.
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
  amt int;
  bal int;
  owned jsonb;
  inserted uuid;
  max_per_game constant int := 20;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  if p_game_id is null or length(trim(p_game_id)) < 4 or length(p_game_id) > 80 then
    raise exception 'invalid game id';
  end if;

  amt := least(greatest(coalesce(p_amount, 0), 0), max_per_game);
  bal := public.ensure_bone_wallet(uid);

  select coalesce(data->'ownedExclusiveDogs', '[]'::jsonb)
    into owned
  from public.user_data
  where user_id = uid;

  if amt = 0 then
    return jsonb_build_object(
      'bones', bal,
      'ownedExclusiveDogs', coalesce(owned, '[]'::jsonb),
      'awarded', false
    );
  end if;

  insert into public.bone_ledger (user_id, amount, kind, game_id)
  values (uid, amt, 'game', p_game_id)
  on conflict (user_id, game_id) where game_id is not null
  do nothing
  returning id into inserted;

  if inserted is null then
    return jsonb_build_object(
      'bones', bal,
      'ownedExclusiveDogs', coalesce(owned, '[]'::jsonb),
      'awarded', false
    );
  end if;

  update public.bone_wallets
  set balance = balance + amt, updated_at = now()
  where user_id = uid
  returning balance into bal;

  perform public.sync_user_data_bones(uid, bal);

  return jsonb_build_object(
    'bones', bal,
    'ownedExclusiveDogs', coalesce(owned, '[]'::jsonb),
    'awarded', true,
    'bonesUpdatedAt', (extract(epoch from now()) * 1000)::bigint
  );
end;
$$;

revoke all on function public.award_game_bones(text, integer) from public;
grant execute on function public.award_game_bones(text, integer) to authenticated;

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

  bones := public.ensure_bone_wallet(uid);

  select data into d from public.user_data where user_id = uid for update;
  if d is null then
    d := jsonb_build_object('bones', bones, 'ownedExclusiveDogs', '[]'::jsonb);
    insert into public.user_data (user_id, data, updated_at)
    values (uid, d, now());
    select data into d from public.user_data where user_id = uid for update;
  end if;

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

  update public.bone_wallets
  set balance = bones, updated_at = now()
  where user_id = uid;

  insert into public.bone_ledger (user_id, amount, kind, meta)
  values (uid, -cost, 'purchase', jsonb_build_object('dog', p_dog));

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

-- Stats upsert: never take client bones; pin from bone_wallets.
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
  owned_val jsonb;
  bones_at_val jsonb;
  wallet_bal int;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  safe := coalesce(p_data, '{}'::jsonb)
    - 'bones'
    - 'ownedExclusiveDogs'
    - 'bonesUpdatedAt';

  wallet_bal := public.ensure_bone_wallet(uid);

  select data into existing from public.user_data where user_id = uid for update;

  if existing is null then
    safe := jsonb_set(safe, '{bones}', to_jsonb(wallet_bal));
    safe := jsonb_set(safe, '{ownedExclusiveDogs}', '[]'::jsonb);
    insert into public.user_data (user_id, data, updated_at)
    values (uid, safe, now())
    returning data into merged;
    return merged;
  end if;

  merged := safe;
  owned_val := existing -> 'ownedExclusiveDogs';
  bones_at_val := existing -> 'bonesUpdatedAt';

  merged := jsonb_set(merged, '{bones}', to_jsonb(wallet_bal));
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

do $$
begin
  alter publication supabase_realtime add table public.bone_wallets;
exception
  when duplicate_object then null;
end $$;
