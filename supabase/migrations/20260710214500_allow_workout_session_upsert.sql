grant update on table public.workout_sessions to authenticated;

create policy "workout_sessions_update_own" on public.workout_sessions
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
