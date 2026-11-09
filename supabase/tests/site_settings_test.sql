begin;
select plan(9);

select has_table('public', 'site_settings', 'site_settings table exists');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'set-admin@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'set-manager@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
insert into public.profiles (id, display_name, role, active)
values ('a1000000-0000-0000-0000-000000000001', 'Set Admin', 'admin', true), ('a1000000-0000-0000-0000-000000000002', 'Set Manager', 'manager', true);

set local role anon;
select is((select callback_enabled::text || '|' || membership_enabled::text || '|' || coalesce(helloasso_url, '') from public.site_settings), 'true|false|', 'visitors read the default settings');
select throws_ok($$update public.site_settings set callback_enabled = false$$, '42501', null, 'visitors cannot change settings');
reset role;

select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
update public.site_settings set callback_enabled = false;
reset role;
select is((select callback_enabled from public.site_settings), true, 'managers cannot change settings');

select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok($$update public.site_settings set membership_enabled = true, helloasso_url = 'https://www.helloasso.com/associations/janus34'$$, 'administrators change settings');
select throws_ok($$update public.site_settings set helloasso_url = 'https://evil.test/'$$, '23514', null, 'only a HelloAsso address is accepted');
select throws_ok($$insert into public.site_settings (id) values (false)$$, '42501', null, 'nobody adds a second settings row');
reset role;
select throws_ok($$insert into public.site_settings (id) values (false)$$, '23514', null, 'the settings stay a single row');
select is((select membership_enabled from public.site_settings), true, 'the administrator change is kept');

select * from finish();
rollback;
