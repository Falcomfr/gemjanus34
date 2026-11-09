-- The note of the team at the top of the weekly letter; read by everyone, written by the team.
create table public.weekly_letter (
  id boolean primary key default true check (id),
  note text not null default '' check (char_length(note) <= 1500),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

insert into public.weekly_letter default values;

alter table public.weekly_letter enable row level security;

create policy weekly_letter_public_read on public.weekly_letter for select to anon, authenticated using (true);
create policy weekly_letter_team_update on public.weekly_letter for update to authenticated
  using (public.is_active_editor()) with check (public.is_active_editor());

revoke all on public.weekly_letter from anon, authenticated;
grant select on public.weekly_letter to anon, authenticated;
grant update (note, updated_at, updated_by) on public.weekly_letter to authenticated;
