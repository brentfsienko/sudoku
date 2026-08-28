-- Required for Supabase Realtime postgres_changes to filter on
-- non-primary-key columns (to_user_id, guest_id).
-- Without REPLICA IDENTITY FULL, column-level filters are silently ignored
-- and the subscription receives no events.
--
-- Run this in Supabase SQL Editor.

alter table public.friend_requests replica identity full;
alter table public.game_invites    replica identity full;
