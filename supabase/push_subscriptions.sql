-- Web Push subscriptions — one row per browser/device per user.
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query).

create table if not exists push_subscriptions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users on delete cascade,
  endpoint   text        not null unique,
  p256dh     text        not null,
  auth       text        not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

-- Users can only read/write their own subscriptions.
create policy "own" on push_subscriptions
  for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Service-role key bypasses RLS (used by /api/push/send server route).
