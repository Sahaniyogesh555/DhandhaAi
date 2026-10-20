-- Only trusted server-side payment handling may grant a paid plan.
-- Browser users can read their profile, but cannot insert/update a plan.
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
revoke all privileges on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
