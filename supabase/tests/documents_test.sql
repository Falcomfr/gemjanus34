begin;
select plan(9);

select has_table('public', 'documents', 'documents table exists');
select is((select public from storage.buckets where id = 'documents'), true, 'documents bucket is public');
select is((select count(*) from public.documents where storage_path is null), 10::bigint, 'bundled PDFs are listed');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '61000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'documents-editor@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
insert into public.profiles (id, display_name, role, active) values ('61000000-0000-0000-0000-000000000001', 'Documents Editor', 'editor', true);

set local role anon;
select is((select count(*) from public.documents), 10::bigint, 'visitors can read documents');
select throws_ok(
  $$insert into public.documents (title, description, category, document_date, url) values ('Faux', 'Faux document', 'planning', current_date, '/faux.pdf')$$,
  '42501', null, 'visitors cannot add documents'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"61000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$insert into public.documents (id, title, description, category, document_date, url, storage_path, created_by) values ('62000000-0000-0000-0000-000000000001', 'Planning d''automne', 'Planning de la rentrée.', 'planning', '2026-10-20', 'https://example.test/p.pdf', 'planning/automne.pdf', '61000000-0000-0000-0000-000000000001')$$,
  'editors can add documents'
);
select throws_ok(
  $$insert into public.documents (title, description, category, document_date, url) values ('Mauvais', 'Mauvaise catégorie', 'autre', current_date, '/x.pdf')$$,
  '23514', null, 'unknown categories are rejected'
);
select lives_ok($$delete from public.documents where id = '62000000-0000-0000-0000-000000000001'$$, 'editors can delete documents');
select is((select count(*) from public.documents where id = '62000000-0000-0000-0000-000000000001'), 0::bigint, 'deleted document is gone');

select * from finish();
rollback;
