begin;
select plan(5);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'del-admin@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'del-manager@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
insert into public.profiles (id, display_name, role, active)
values
  ('a1000000-0000-0000-0000-000000000001', 'Del Admin', 'admin', true),
  ('a1000000-0000-0000-0000-000000000002', 'Del Manager', 'manager', true);

-- A1 archived, A2 archived with a sub-page A3, A4 a draft.
insert into public.pages (id, slug, title, summary, content, status, created_by, updated_by, parent_id)
values
  ('a2000000-0000-0000-0000-000000000001', 'del-archivee', 'Archivée', '', '{"type":"doc","content":[]}', 'archived', 'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', null),
  ('a2000000-0000-0000-0000-000000000002', 'del-parente', 'Parente', '', '{"type":"doc","content":[]}', 'archived', 'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', null),
  ('a2000000-0000-0000-0000-000000000004', 'del-en-ligne', 'En ligne', '', '{"type":"doc","content":[]}', 'draft', 'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', null);
insert into public.pages (id, slug, title, summary, content, status, created_by, updated_by, parent_id)
values ('a2000000-0000-0000-0000-000000000003', 'del-enfant', 'Enfant', '', '{"type":"doc","content":[]}', 'draft', 'a1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002');
insert into public.page_revisions (page_id, title, summary, content, status, created_by)
values ('a2000000-0000-0000-0000-000000000001', 'Archivée', '', '{"type":"doc","content":[]}', 'published', 'a1000000-0000-0000-0000-000000000001');

select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
delete from public.pages where id = 'a2000000-0000-0000-0000-000000000001';
reset role;
select ok(exists (select 1 from public.pages where id = 'a2000000-0000-0000-0000-000000000001'), 'managers cannot delete a page');

select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
delete from public.pages where id in ('a2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000004');
reset role;
select ok(not exists (select 1 from public.pages where id = 'a2000000-0000-0000-0000-000000000001'), 'admins delete an archived page');
select ok(not exists (select 1 from public.page_revisions where page_id = 'a2000000-0000-0000-0000-000000000001'), 'its revisions go with it');
select ok(exists (select 1 from public.pages where id = 'a2000000-0000-0000-0000-000000000004'), 'a page that is not archived stays');
select ok(exists (select 1 from public.pages where id = 'a2000000-0000-0000-0000-000000000002'), 'a page with sub-pages stays');

select * from finish();
rollback;
