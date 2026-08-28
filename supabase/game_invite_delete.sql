-- Allow host or guest to delete a game invite (decline / cancel).
-- Run in Supabase SQL Editor.

grant delete on table public.game_invites to authenticated;

drop policy if exists "game_invites delete involved" on public.game_invites;
create policy "game_invites delete involved"
  on public.game_invites for delete
  to authenticated
  using (auth.uid() = host_id or auth.uid() = guest_id);
