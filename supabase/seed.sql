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
