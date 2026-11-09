begin;
select plan(17);

select has_function('public', 'is_manager', 'is_manager exists');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '91000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'mgr-admin@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '91000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'mgr-manager@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '91000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'mgr-editor@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
insert into public.profiles (id, display_name, role, active)
values
  ('91000000-0000-0000-0000-000000000001', 'Mgr Admin', 'admin', true),
  ('91000000-0000-0000-0000-000000000002', 'Mgr Manager', 'manager', true),
  ('91000000-0000-0000-0000-000000000003', 'Mgr Editor', 'editor', true);

-- P1 published, P2 draft never published, P3 published once then archived.
insert into public.pages (id, slug, title, summary, content, status, created_by, updated_by, published_at)
values
  ('92000000-0000-0000-0000-000000000001', 'mgr-en-ligne', 'En ligne', 'Résumé', '{"type":"doc","content":[]}', 'published', '91000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', now()),
  ('92000000-0000-0000-0000-000000000002', 'mgr-brouillon', 'Brouillon', 'Résumé', '{"type":"doc","content":[]}', 'draft', '91000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', null),
  ('92000000-0000-0000-0000-000000000003', 'mgr-archivee', 'Archivée', 'Résumé', '{"type":"doc","content":[]}', 'archived', '91000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', null);
insert into public.page_revisions (id, page_id, title, summary, content, status, created_by)
values
  ('93000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', 'En ligne', 'Résumé', '{"type":"doc","content":[]}', 'published', '91000000-0000-0000-0000-000000000001'),
  ('93000000-0000-0000-0000-000000000003', '92000000-0000-0000-0000-000000000003', 'Archivée', 'Résumé', '{"type":"doc","content":[]}', 'published', '91000000-0000-0000-0000-000000000001');
insert into public.news (id, title, excerpt, starts_at, status, created_by, updated_by)
values
  ('94000000-0000-0000-0000-000000000001', 'Sortie en ligne', 'Résumé', '2030-01-01T10:00:00Z', 'published', '91000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001'),
  ('94000000-0000-0000-0000-000000000002', 'Sortie archivée', 'Résumé', '2030-01-01T10:00:00Z', 'archived', '91000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001');

-- Manager: changes the content of what exists.
select set_config('request.jwt.claims', '{"sub":"91000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select ok(public.is_manager(), 'a manager is a manager');
select lives_ok(
  $$select public.update_published_page('92000000-0000-0000-0000-000000000001', 'Corrigé', 'Résumé', '{"type":"doc","content":[]}')$$,
  'managers edit a published page'
);
select lives_ok($$select public.publish_page('92000000-0000-0000-0000-000000000003')$$, 'managers republish a page published before');
select throws_ok($$select public.publish_page('92000000-0000-0000-0000-000000000002')$$, '42501', null, 'managers cannot put a never published page online');
select throws_ok($$update public.pages set slug = 'autre-adresse', updated_by = '91000000-0000-0000-0000-000000000002' where id = '92000000-0000-0000-0000-000000000002'$$, '42501', null, 'managers cannot change a page address');
select throws_ok($$update public.pages set navigation_position = 5, updated_by = '91000000-0000-0000-0000-000000000002' where id = '92000000-0000-0000-0000-000000000002'$$, '42501', null, 'managers cannot change the menu');
select throws_ok($$update public.pages set status = 'archived', updated_by = '91000000-0000-0000-0000-000000000002' where id = '92000000-0000-0000-0000-000000000001'$$, '42501', null, 'managers cannot archive a page');
select ok((select count(*) from public.page_revisions where page_id = '92000000-0000-0000-0000-000000000001') > 0, 'managers read page revisions');
select lives_ok($$select public.restore_page_revision('93000000-0000-0000-0000-000000000001')$$, 'managers restore a page revision');
select lives_ok($$select public.archive_news('94000000-0000-0000-0000-000000000001')$$, 'managers archive news');
select lives_ok($$select public.restore_news('94000000-0000-0000-0000-000000000002')$$, 'managers restore news');
update public.profiles set display_name = 'Pirate' where id = '91000000-0000-0000-0000-000000000003';
reset role;
select is((select status::text from public.pages where id = '92000000-0000-0000-0000-000000000003'), 'published', 'the republished page is online');
select is((select display_name from public.profiles where id = '91000000-0000-0000-0000-000000000003'), 'Mgr Editor', 'managers cannot change other accounts');

-- Editor: unchanged rights.
select set_config('request.jwt.claims', '{"sub":"91000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select ok(not public.is_manager(), 'an editor is not a manager');
select throws_ok(
  $$select public.update_published_page('92000000-0000-0000-0000-000000000001', 'Pirate', 'Résumé', '{"type":"doc","content":[]}')$$,
  '42501', null, 'editors still cannot edit a published page'
);
select throws_ok($$select public.restore_news('94000000-0000-0000-0000-000000000001')$$, '42501', null, 'editors still cannot restore news');
reset role;

select * from finish();
rollback;
