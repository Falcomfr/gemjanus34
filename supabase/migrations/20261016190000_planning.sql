-- Weekly planning managed in the admin, seeded from Planning-19-06-2026.pdf (in force from 22/06/2026).

create table public.planning_settings (
  id smallint primary key default 1 check (id = 1),
  effective_from date not null,
  note text not null default '' check (char_length(note) <= 300),
  updated_at timestamptz not null default now()
);

create table public.planning_days (
  day smallint primary key check (day between 1 and 6),
  opens_at time,
  closes_at time,
  team text not null default '' check (char_length(team) <= 120),
  check (closes_at is null or opens_at is null or closes_at > opens_at)
);

create table public.planning_slots (
  id uuid primary key default gen_random_uuid(),
  day smallint not null references public.planning_days(day),
  starts_at time not null,
  ends_at time not null,
  title text not null check (char_length(title) between 1 and 120),
  leader text not null default '' check (char_length(leader) <= 120),
  note text not null default '' check (char_length(note) <= 300),
  family text not null check (family in ('creer', 'bouger', 'echanger')),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

alter table public.planning_settings enable row level security;
alter table public.planning_days enable row level security;
alter table public.planning_slots enable row level security;

create policy planning_settings_public_read on public.planning_settings for select to anon, authenticated using (true);
create policy planning_days_public_read on public.planning_days for select to anon, authenticated using (true);
create policy planning_slots_public_read on public.planning_slots for select to anon, authenticated using (true);

create policy planning_settings_editor_update on public.planning_settings for update to authenticated
  using (public.is_active_editor()) with check (public.is_active_editor());
create policy planning_days_editor_update on public.planning_days for update to authenticated
  using (public.is_active_editor()) with check (public.is_active_editor());
create policy planning_slots_editor_write on public.planning_slots for all to authenticated
  using (public.is_active_editor()) with check (public.is_active_editor());

insert into public.planning_settings (effective_from, note)
values ('2026-06-22', 'Ouverture du GEM à 13 h et accueil du public.');

insert into public.planning_days (day, opens_at, closes_at, team) values
  (1, '13:00', '18:00', 'Mona'),
  (2, '13:00', '18:00', 'Mona et Elif'),
  (3, '13:00', '18:00', 'Elif et Mona'),
  (4, '13:00', '18:00', 'Mona et Elif'),
  (5, '13:00', '18:00', 'Elif et Mona'),
  (6, '13:00', '18:00', 'Adhérent ou animatrice');

insert into public.planning_slots (day, starts_at, ends_at, title, leader, note, family) values
  (1, '14:00', '16:00', 'Expression créatrice', 'Sarah', '', 'creer'),
  (2, '14:30', '15:30', 'Qi Gong', 'Adrien', '', 'bouger'),
  (2, '16:00', '17:30', 'Groupe d''échange libre / groupe de parole à thème', 'Mona et Elif', 'En alternance', 'echanger'),
  (3, '15:00', '16:00', 'Les mots qui volent', 'Elif', '', 'creer'),
  (4, '10:00', '13:00', 'GEM « Hors les murs »', 'Elif', 'Accueil au café Little Italy Shop de 10 h à 10 h 45, puis visite d''exposition, balade, pique-nique…', 'bouger'),
  (4, '10:00', '13:00', 'Soupe au caillou', 'Elif', 'Chaque dernier jeudi du mois, à la place du GEM « Hors les murs ». Sur inscription.', 'echanger'),
  (4, '15:00', '16:30', 'Yoga en douceur', 'Sévérine', '', 'bouger'),
  (4, '16:45', '17:45', 'Écriture poétique', 'Mona', '', 'creer'),
  (5, '14:00', '16:00', 'Linogravure', 'Elif', '', 'creer'),
  (6, '13:00', '18:00', 'Événements collectifs', '', 'Goûters, projection de film, repas, pétanque, sortie…', 'echanger'),
  (6, '14:00', '15:00', 'Collage', 'Mona', 'Une fois par mois', 'creer');
