alter table public.exercises
  add column category text not null default 'other',
  add column is_default boolean not null default false,
  add column sort_order integer not null default 0,
  add constraint exercises_category_check check (category in (
    'squat',
    'snatch',
    'clean',
    'clean_and_jerk',
    'jerk',
    'strength',
    'press',
    'other'
  ));

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

  insert into public.exercises (user_id, name, category, is_default, sort_order)
  values
    (new.id, 'Back Squat', 'squat', true, 10),
    (new.id, 'Front Squat', 'squat', true, 20),
    (new.id, 'Overhead Squat', 'squat', true, 30),
    (new.id, 'Squat Snatch', 'snatch', true, 40),
    (new.id, 'Power Snatch', 'snatch', true, 50),
    (new.id, 'Hang Snatch', 'snatch', true, 60),
    (new.id, 'Squat Clean', 'clean', true, 70),
    (new.id, 'Power Clean', 'clean', true, 80),
    (new.id, 'Hang Clean', 'clean', true, 90),
    (new.id, 'Clean and Jerk', 'clean_and_jerk', true, 100),
    (new.id, 'Split Jerk', 'jerk', true, 110),
    (new.id, 'Push Jerk', 'jerk', true, 120),
    (new.id, 'Power Jerk', 'jerk', true, 130),
    (new.id, 'Deadlift', 'strength', true, 140),
    (new.id, 'Sumo Deadlift', 'strength', true, 150),
    (new.id, 'Romanian Deadlift', 'strength', true, 160),
    (new.id, 'Clean Deadlift', 'strength', true, 170),
    (new.id, 'Snatch Deadlift', 'strength', true, 180),
    (new.id, 'Strict Press', 'press', true, 190),
    (new.id, 'Push Press', 'press', true, 200),
    (new.id, 'Bench Press', 'press', true, 210),
    (new.id, 'Thruster', 'other', true, 220)
  on conflict do nothing;

  return new;
end;
$$;

with default_exercises (name, category, sort_order) as (
  values
    ('Back Squat', 'squat', 10),
    ('Front Squat', 'squat', 20),
    ('Overhead Squat', 'squat', 30),
    ('Squat Snatch', 'snatch', 40),
    ('Power Snatch', 'snatch', 50),
    ('Hang Snatch', 'snatch', 60),
    ('Squat Clean', 'clean', 70),
    ('Power Clean', 'clean', 80),
    ('Hang Clean', 'clean', 90),
    ('Clean and Jerk', 'clean_and_jerk', 100),
    ('Split Jerk', 'jerk', 110),
    ('Push Jerk', 'jerk', 120),
    ('Power Jerk', 'jerk', 130),
    ('Deadlift', 'strength', 140),
    ('Sumo Deadlift', 'strength', 150),
    ('Romanian Deadlift', 'strength', 160),
    ('Clean Deadlift', 'strength', 170),
    ('Snatch Deadlift', 'strength', 180),
    ('Strict Press', 'press', 190),
    ('Push Press', 'press', 200),
    ('Bench Press', 'press', 210),
    ('Thruster', 'other', 220)
)
insert into public.exercises (user_id, name, category, is_default, sort_order)
select users.id, default_exercises.name, default_exercises.category, true, default_exercises.sort_order
from auth.users as users
cross join default_exercises
on conflict do nothing;
