create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trained_at date not null default current_date,
  created_at timestamptz not null default now(),
  constraint workout_sessions_user_day_key unique (user_id, trained_at)
);

create index workout_sessions_user_trained_at_idx on public.workout_sessions (user_id, trained_at desc);

alter table public.workout_sessions enable row level security;

create policy "workout_sessions_select_own" on public.workout_sessions
for select to authenticated using ((select auth.uid()) = user_id);
create policy "workout_sessions_insert_own" on public.workout_sessions
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "workout_sessions_delete_own" on public.workout_sessions
for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, delete on table public.workout_sessions to authenticated;
revoke all on table public.workout_sessions from anon;
