-- LOCAL DEVELOPMENT ONLY. Never apply these credentials to a linked or cloud project.
-- Login: admin@gemjanus34.local / local-development-only

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'admin@gemjanus34.local',
  crypt('local-development-only', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  jsonb_build_object(
    'sub', '00000000-0000-4000-8000-000000000001',
    'email', 'admin@gemjanus34.local',
    'email_verified', true
  ),
  'email',
  now(),
  now(),
  now()
);

insert into public.profiles (
  id,
  display_name,
  role,
  active,
  notify_on_publish
)
values (
  '00000000-0000-4000-8000-000000000001',
  'Administrateur local',
  'admin',
  true,
  true
);

insert into public.pages (
  id,
  slug,
  title,
  summary,
  content,
  status,
  navigation_position,
  created_by,
  updated_by,
  published_at
)
values (
  '00000000-0000-4000-8000-000000000101',
  'bienvenue-locale',
  'Bienvenue dans l administration locale',
  'Page de demonstration disponible uniquement dans Supabase local.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Cette page confirme que le contenu publie est accessible localement."}]}]}',
  'published',
  1,
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  now()
);

-- Announcements taken from the "Quoi de neuf" page of the original site (October 2026).
insert into public.news (id, title, excerpt, starts_at, ends_at, featured, status, created_by, updated_by)
values
  (
    '00000000-0000-4000-8000-000000000201',
    'GEM Hors les murs au musée Fabre',
    'Après le temps d''accueil au café The Little Italy Shop (4 bis cours Gambetta, près de l''arrêt Saint-Denis du tram 3), visite de l''exposition « Le Design selon Pierre Paulin » au musée Fabre. Le GEM prend en charge les billets d''entrée ; pensez à vos justificatifs pour les réductions.',
    '2026-10-08T10:00:00+02:00',
    '2026-10-08T13:00:00+02:00',
    true,
    'published',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001'
  ),
  (
    '00000000-0000-4000-8000-000000000202',
    'Groupe de parole annulé le 6 octobre',
    'Le groupe de parole du mardi 6 octobre est exceptionnellement annulé. L''atelier Qi Gong a lieu comme prévu à 14 h 30.',
    '2026-10-06T16:00:00+02:00',
    null,
    false,
    'published',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001'
  ),
  (
    '00000000-0000-4000-8000-000000000203',
    'Atelier collage du samedi 3 octobre',
    'L''atelier collage a lieu à 14 h. Ce samedi, le GEM est ouvert par une animatrice.',
    '2026-10-03T14:00:00+02:00',
    '2026-10-03T15:00:00+02:00',
    false,
    'published',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001'
  );
