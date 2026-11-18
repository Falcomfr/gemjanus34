begin;
select plan(4);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'newsdel-manager@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'newsdel-editor@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
insert into public.profiles (id, display_name, role, active)
values
  ('b1000000-0000-0000-0000-000000000001', 'NewsDel Manager', 'manager', true),
  ('b1000000-0000-0000-0000-000000000002', 'NewsDel Editor', 'editor', true);

-- B1 archived, B2 published.
insert into public.news (id, title, excerpt, content, starts_at, status, created_by, updated_by)
values
  ('b2000000-0000-0000-0000-000000000001', 'Archivée', 'Résumé', '{"type":"doc","content":[]}', now(), 'archived', 'b1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
  ('b2000000-0000-0000-0000-000000000002', 'En ligne', 'Résumé', '{"type":"doc","content":[]}', now(), 'published', 'b1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001');

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select lives_ok($$delete from public.news where id = 'b2000000-0000-0000-0000-000000000001'$$, 'an editor may send the delete');
reset role;
select ok(exists (select 1 from public.news where id = 'b2000000-0000-0000-0000-000000000001'), 'but editors cannot delete news');

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
delete from public.news where id in ('b2000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002');
reset role;
select ok(not exists (select 1 from public.news where id = 'b2000000-0000-0000-0000-000000000001'), 'managers delete archived news');
select ok(exists (select 1 from public.news where id = 'b2000000-0000-0000-0000-000000000002'), 'published news stays');

select * from finish();
rollback;
