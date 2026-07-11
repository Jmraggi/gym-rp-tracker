grant usage on schema public to authenticated;
grant select, insert, delete on table public.workout_sessions to authenticated;

revoke all on table public.workout_sessions from anon;
