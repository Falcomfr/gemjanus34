begin;
select plan(19);

select has_function('public', 'publish_news', array['uuid'], 'publish_news(uuid) exists');
select has_function('public', 'archive_news', array['uuid'], 'archive_news(uuid) exists');
select has_function('public', 'restore_news', array['uuid'], 'restore_news(uuid) exists');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '51000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'news-admin@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '51000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'news-editor@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.profiles (id, display_name, role, active)
values
  ('51000000-0000-0000-0000-000000000001', 'News Admin', 'admin', true),
  ('51000000-0000-0000-0000-000000000002', 'News Editor', 'editor', true);

select set_config('request.jwt.claims', '{"sub":"51000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$insert into public.news (id, title, excerpt, starts_at, created_by, updated_by) values ('52000000-0000-0000-0000-000000000001', 'Editor draft', 'Draft excerpt', now(), '51000000-0000-0000-0000-000000000002', '51000000-0000-0000-0000-000000000002')$$,
  'editors can create news drafts'
);
select throws_like(
  $$update public.news set status = 'published', updated_by = '51000000-0000-0000-0000-000000000002' where id = '52000000-0000-0000-0000-000000000001'$$,
  '%publication RPC%',
  'editors cannot publish through a general update'
);
select lives_ok(
  $$select public.publish_news('52000000-0000-0000-0000-000000000001')$$,
  'editors can publish through the dedicated RPC'
);
select is((select status from public.news where id = '52000000-0000-0000-0000-000000000001'), 'published'::public.content_status, 'editor publication changes status');
reset role;
select is((select count(*) from public.audit_log where action = 'news.publish' and entity_id = '52000000-0000-0000-0000-000000000001' and actor_id = '51000000-0000-0000-0000-000000000002'), 1::bigint, 'editor publication is audited');
set local role authenticated;
select throws_like($$select public.archive_news('52000000-0000-0000-0000-000000000001')$$, '%administrator%', 'editors cannot archive news');
select throws_like($$select public.restore_news('52000000-0000-0000-0000-000000000001')$$, '%administrator%', 'editors cannot restore news');
select throws_like(
  $$update public.news set title = 'Changed live', updated_by = '51000000-0000-0000-0000-000000000002' where id = '52000000-0000-0000-0000-000000000001'$$,
  '%draft%',
  'editors cannot edit published news'
);
select throws_like($$select public.publish_page('20000000-0000-0000-0000-000000000002')$$, '%administrator%', 'page publication permissions remain admin-only');

reset role;
select set_config('request.jwt.claims', '{"sub":"51000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select lives_ok($$select public.archive_news('52000000-0000-0000-0000-000000000001')$$, 'administrators can archive news through the RPC');
select is((select status from public.news where id = '52000000-0000-0000-0000-000000000001'), 'archived'::public.content_status, 'archive changes status');
reset role;
select is((select count(*) from public.audit_log where action = 'news.archive' and entity_id = '52000000-0000-0000-0000-000000000001'), 1::bigint, 'archive is audited');
set local role authenticated;
select throws_like(
  $$update public.news set status = 'published', updated_by = '51000000-0000-0000-0000-000000000001' where id = '52000000-0000-0000-0000-000000000001'$$,
  '%restoration RPC%',
  'administrators cannot restore through a general update'
);
select lives_ok($$select public.restore_news('52000000-0000-0000-0000-000000000001')$$, 'administrators can restore news through the RPC');
select is((select status from public.news where id = '52000000-0000-0000-0000-000000000001'), 'published'::public.content_status, 'restore republishes archived news');
reset role;
select is((select count(*) from public.audit_log where action = 'news.restore' and entity_id = '52000000-0000-0000-0000-000000000001'), 1::bigint, 'restore is audited');

select * from finish();
rollback;
