begin;
select plan(5);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'c1000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'theme-admin@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c1000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'theme-manager@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
insert into public.profiles (id, display_name, role, active)
values ('c1000000-0000-0000-0000-000000000001', 'Theme Admin', 'admin', true), ('c1000000-0000-0000-0000-000000000002', 'Theme Manager', 'manager', true);

select is((select theme from public.site_settings), null, 'the site starts with its original colours');

select set_config('request.jwt.claims', '{"sub":"c1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$update public.site_settings set theme = '{"forest":"#112233","coral":"#a83020","sun":"#f2c14e","background":"#ffffff","text":"#111111"}'$$,
  'administrators store five #rrggbb colours'
);
select throws_ok($$update public.site_settings set theme = '{"forest":"red","coral":"#a83020","sun":"#f2c14e","background":"#ffffff","text":"#111111"}'$$, '23514', null, 'a colour that is not #rrggbb is refused');
select throws_ok($$update public.site_settings set theme = '{"forest":"#112233","coral":"#a83020","sun":"#f2c14e","background":"#ffffff","text":"#111111","x":"</style>"}'$$, '23514', null, 'extra keys are refused');
reset role;

select set_config('request.jwt.claims', '{"sub":"c1000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
update public.site_settings set theme = null;
reset role;
select is((select theme->>'forest' from public.site_settings), '#112233', 'managers cannot change the colours');

select * from finish();
rollback;
