begin;
select plan(5);

select is((select count(*) from public.weekly_letter), 1::bigint, 'the weekly letter is a single row');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'd1000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'letter-editor@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
insert into public.profiles (id, display_name, role, active) values ('d1000000-0000-0000-0000-000000000001', 'Letter Editor', 'editor', true);

set local role anon;
select is((select note from public.weekly_letter), '', 'visitors read the note of the team');
select throws_ok($$update public.weekly_letter set note = 'Pirate'$$, '42501', null, 'visitors cannot change it');
reset role;

select set_config('request.jwt.claims', '{"sub":"d1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok($$update public.weekly_letter set note = 'Bonne semaine à toutes et à tous !', updated_by = 'd1000000-0000-0000-0000-000000000001'$$, 'the team writes the note');
select throws_ok($$update public.weekly_letter set note = repeat('x', 1501)$$, '23514', null, 'a note over 1 500 characters is refused');
reset role;

select * from finish();
rollback;
