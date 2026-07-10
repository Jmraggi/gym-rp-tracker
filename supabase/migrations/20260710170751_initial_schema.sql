create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  default_bar_weight numeric(5, 2) not null default 20,
  rounding_mode text not null default 'nearest',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_default_bar_weight_check check (default_bar_weight in (15, 20)),
  constraint profiles_rounding_mode_check check (rounding_mode in ('nearest', 'down'))
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_name_not_blank_check check (char_length(btrim(name)) > 0),
  constraint exercises_id_user_id_key unique (id, user_id)
);

create unique index exercises_user_id_lower_name_key
  on public.exercises (user_id, lower(name));

create table public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null,
  weight numeric(7, 2) not null,
  achieved_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_records_weight_positive_check check (weight > 0),
  constraint personal_records_exercise_owner_fkey
    foreign key (exercise_id, user_id)
    references public.exercises(id, user_id)
    on delete cascade
);

create index personal_records_user_id_idx on public.personal_records (user_id);
create index personal_records_exercise_id_idx on public.personal_records (exercise_id);
create index personal_records_achieved_at_idx on public.personal_records (achieved_at);
create index personal_records_exercise_id_achieved_at_idx
  on public.personal_records (exercise_id, achieved_at desc);

create table public.user_plates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight numeric(5, 2) not null,
  quantity integer,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_plates_weight_positive_check check (weight > 0),
  constraint user_plates_quantity_nonnegative_check check (quantity is null or quantity >= 0),
  constraint user_plates_user_id_weight_key unique (user_id, weight)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger exercises_set_updated_at
before update on public.exercises
for each row execute function public.set_updated_at();

create trigger personal_records_set_updated_at
before update on public.personal_records
for each row execute function public.set_updated_at();

create trigger user_plates_set_updated_at
before update on public.user_plates
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_plates (user_id, weight, quantity, enabled)
  values
    (new.id, 20, null, true),
    (new.id, 15, null, true),
    (new.id, 10, null, true),
    (new.id, 5, null, true),
    (new.id, 2.5, null, true),
    (new.id, 1.25, null, true)
  on conflict (user_id, weight) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.personal_records enable row level security;
alter table public.user_plates enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles
for delete to authenticated using ((select auth.uid()) = id);

create policy "exercises_select_own" on public.exercises
for select to authenticated using ((select auth.uid()) = user_id);
create policy "exercises_insert_own" on public.exercises
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "exercises_update_own" on public.exercises
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "exercises_delete_own" on public.exercises
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "personal_records_select_own" on public.personal_records
for select to authenticated using ((select auth.uid()) = user_id);
create policy "personal_records_insert_own" on public.personal_records
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "personal_records_update_own" on public.personal_records
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "personal_records_delete_own" on public.personal_records
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "user_plates_select_own" on public.user_plates
for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_plates_insert_own" on public.user_plates
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_plates_update_own" on public.user_plates
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_plates_delete_own" on public.user_plates
for delete to authenticated using ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on table
  public.profiles,
  public.exercises,
  public.personal_records,
  public.user_plates
to authenticated;

revoke all on table
  public.profiles,
  public.exercises,
  public.personal_records,
  public.user_plates
from anon;

revoke all on function public.set_updated_at() from public;
revoke all on function public.handle_new_user() from public;
