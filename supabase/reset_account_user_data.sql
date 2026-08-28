-- Reset a contaminated user_data blob for one email (stats/profile/history
-- that got merged from another account on the same browser).
-- Does NOT delete the auth user, public profile, friends, or daily_results.
--
-- Replace the email, then run in the Supabase SQL editor.

update public.user_data
set
  data = '{}'::jsonb,
  updated_at = now()
where user_id = (
  select id from auth.users where email = 'brent5@berkeley.edu'
);
