-- Required for Supabase Realtime postgres_changes to filter on
-- non-primary-key columns (to_user_id, guest_id).
-- Without REPLICA IDENTITY FULL, column-level filters are silently ignored
-- and the subscription receives no events.
--
-- Run this in Supabase SQL Editor.

alter table public.friend_requests replica identity full;
alter table public.game_invites    replica identity full;

-- user_data PK is user_id, so default replica identity is enough to filter
-- on that column. Add the table to the realtime publication so every signed-in
-- device sees wallet (bones) updates immediately.
do $$
begin
  alter publication supabase_realtime add table public.user_data;
exception
  when duplicate_object then null;
end $$;
