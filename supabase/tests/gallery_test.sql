begin;
select plan(10);

select has_table('public', 'gallery_items', 'gallery_items table exists');
select is((select public::text || '|' || file_size_limit || '|' || array_to_string(allowed_mime_types, ',') from storage.buckets where id = 'gallery'), 'true|4194304|image/jpeg,image/png,image/webp', 'gallery bucket is public and takes images up to 4 MB');
select is((select gallery_enabled from public.site_settings), false, 'the gallery starts switched off');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'gallery-editor@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
insert into public.profiles (id, display_name, role, active) values ('b1000000-0000-0000-0000-000000000001', 'Gallery Editor', 'editor', true);

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$insert into public.gallery_items (title, author, workshop, image_path, image_url, consent, created_by) values ('Le phare', 'Lou', 'Linogravure', 'gallery/phare.jpg', 'https://example.test/phare.jpg', true, 'b1000000-0000-0000-0000-000000000001')$$,
  'editors add a creation with the author''s consent'
);
select throws_ok(
  $$insert into public.gallery_items (title, image_path, image_url, consent, created_by) values ('Sans accord', 'gallery/x.jpg', 'https://example.test/x.jpg', false, 'b1000000-0000-0000-0000-000000000001')$$,
  '23514', null, 'a creation without the author''s consent is refused'
);
reset role;

set local role anon;
select is((select count(*) from public.gallery_items), 0::bigint, 'visitors see nothing while the gallery is off');
select throws_ok(
  $$insert into public.gallery_items (title, image_path, image_url, consent, created_by) values ('Pirate', 'gallery/p.jpg', 'https://example.test/p.jpg', true, 'b1000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'visitors cannot add creations'
);
reset role;

update public.site_settings set gallery_enabled = true;
set local role anon;
select is((select count(*) from public.gallery_items), 1::bigint, 'visitors see the creations once the gallery is on');
reset role;

select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok($$delete from public.gallery_items where title = 'Le phare'$$, 'editors remove a creation');
reset role;
select is((select count(*) from public.gallery_items), 0::bigint, 'the removed creation is gone');

select * from finish();
rollback;
