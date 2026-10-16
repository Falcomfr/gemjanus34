-- Dated planning: monthly recurrences, and cancellations, closures and one-off sessions on given dates.

-- recurrence: every week, only some weeks of the month, or every week but some.
-- month_weeks: 1 to 5 for the n-th weekday of the month, -1 for the last one.
alter table public.planning_slots
  add column recurrence text not null default 'weekly' check (recurrence in ('weekly', 'only', 'except')),
  add column month_weeks smallint[] not null default '{}',
  add constraint planning_slots_month_weeks_check check (
    month_weeks <@ array[-1, 1, 2, 3, 4, 5]::smallint[]
    and (recurrence = 'weekly') = (cardinality(month_weeks) = 0)
  );

update public.planning_slots set recurrence = 'only', month_weeks = '{-1}' where title = 'Soupe au caillou';
update public.planning_slots set recurrence = 'except', month_weeks = '{-1}' where title = 'GEM « Hors les murs »';
update public.planning_slots set recurrence = 'only', month_weeks = '{1}' where title = 'Collage';

-- The recurrence now says it; notes the team has not edited since the import lose the repetition.
update public.planning_slots set note = '' where title = 'Collage' and note = 'Une fois par mois';
update public.planning_slots set note = 'À la place du GEM « Hors les murs ». Sur inscription.'
where title = 'Soupe au caillou' and note = 'Chaque dernier jeudi du mois, à la place du GEM « Hors les murs ». Sur inscription.';

create table public.planning_exceptions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('cancel', 'closure', 'extra')),
  date date not null,
  -- Closures only: last closed day, included.
  end_date date,
  last_date date generated always as (coalesce(end_date, date)) stored,
  slot_id uuid references public.planning_slots(id) on delete cascade,
  hidden boolean not null default false,
  reason text not null default '' check (char_length(reason) <= 200),
  starts_at time,
  ends_at time,
  title text check (char_length(title) between 1 and 120),
  leader text not null default '' check (char_length(leader) <= 120),
  description text not null default '' check (char_length(description) <= 600),
  family text check (family in ('creer', 'bouger', 'echanger')),
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (kind <> 'cancel' or slot_id is not null),
  check ((kind = 'closure') = (end_date is not null) and (end_date is null or end_date >= date)),
  check (kind <> 'extra' or (starts_at is not null and ends_at > starts_at and title is not null and family is not null)),
  check (kind = 'closure' or extract(isodow from date) between 1 and 6)
);

create index planning_exceptions_last_date_idx on public.planning_exceptions (last_date);

alter table public.planning_exceptions enable row level security;

create policy planning_exceptions_public_read on public.planning_exceptions for select to anon, authenticated using (true);
create policy planning_exceptions_editor_insert on public.planning_exceptions for insert to authenticated
  with check (public.is_active_editor());
create policy planning_exceptions_editor_delete on public.planning_exceptions for delete to authenticated
  using (public.is_active_editor());

revoke all on public.planning_exceptions from anon, authenticated;
grant select on public.planning_exceptions to anon, authenticated;
grant insert, delete on public.planning_exceptions to authenticated;
