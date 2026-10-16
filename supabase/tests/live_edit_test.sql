begin;
select plan(10);

select has_function('public', 'update_published_page', array['uuid', 'text', 'text', 'jsonb'], 'update_published_page exists');
select has_function('public', 'update_published_news', array['uuid', 'text', 'text', 'jsonb', 'timestamp with time zone', 'timestamp with time zone', 'boolean'], 'update_published_news exists');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '81000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'live-admin@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '81000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'live-editor@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
insert into public.profiles (id, display_name, role, active)
values ('81000000-0000-0000-0000-000000000001', 'Live Admin', 'admin', true), ('81000000-0000-0000-0000-000000000002', 'Live Editor', 'editor', true);

insert into public.pages (id, slug, title, summary, content, status, created_by, updated_by, published_at)
values ('82000000-0000-0000-0000-000000000001', 'page-en-ligne', 'Titre en ligne', 'Résumé', '{"type":"doc","content":[]}', 'published', '81000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', now());
insert into public.news (id, title, excerpt, starts_at, status, created_by, updated_by)
values ('83000000-0000-0000-0000-000000000001', 'Sortie en ligne', 'Résumé', '2030-01-01T10:00:00Z', 'published', '81000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001');

select set_config('request.jwt.claims', '{"sub":"81000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select throws_like(
  $$select public.update_published_page('82000000-0000-0000-0000-000000000001', 'Pirate', 'Résumé', '{"type":"doc","content":[]}')$$,
  '%administrator%',
  'editors cannot edit a published page'
);
select lives_ok(
  $$select public.update_published_news('83000000-0000-0000-0000-000000000001', 'Sortie corrigée', 'Nouveau résumé', '{"type":"doc","content":[]}', '2030-01-02T10:00:00Z', null, true)$$,
  'editors can correct published news'
);
reset role;
select is((select title || '|' || status || '|' || featured from public.news where id = '83000000-0000-0000-0000-000000000001'), 'Sortie corrigée|published|true', 'news stays published with the correction');
select is((select count(*) from public.audit_log where action = 'news.update_published'), 1::bigint, 'news correction is audited');

select set_config('request.jwt.claims', '{"sub":"81000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$select public.update_published_page('82000000-0000-0000-0000-000000000001', 'Titre corrigé', 'Résumé corrigé', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Texte"}]}]}')$$,
  'administrators can edit a published page'
);
reset role;
select is((select title || '|' || status from public.pages where id = '82000000-0000-0000-0000-000000000001'), 'Titre corrigé|published', 'page stays published with the correction');
select is((select count(*) from public.page_revisions where page_id = '82000000-0000-0000-0000-000000000001' and title = 'Titre corrigé'), 1::bigint, 'the correction is kept as a revision');
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_like(
  $$select public.update_published_page('82000000-0000-0000-0000-000000000001', 'X', 'Y', '{"type":"doc","content":[]}')$$,
  '%permission denied%',
  'anonymous callers are refused'
);
reset role;

select * from finish();
rollback;
