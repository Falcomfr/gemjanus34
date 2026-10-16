begin;
select plan(8);

select has_table('public', 'planning_slots', 'planning_slots exists');
select is((select count(*) from public.planning_slots), 11::bigint, 'the current planning is imported');
select is((select count(*) from public.planning_days), 6::bigint, 'Monday to Saturday are described');
select is((select effective_from from public.planning_settings), '2026-06-22'::date, 'the planning is in force from 22 June 2026');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '91000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'planning-editor@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
insert into public.profiles (id, display_name, role, active) values ('91000000-0000-0000-0000-000000000001', 'Planning Editor', 'editor', true);

set local role anon;
select is((select count(*) from public.planning_slots), 11::bigint, 'visitors read the planning');
select throws_ok(
  $$insert into public.planning_slots (day, starts_at, ends_at, title, family) values (1, '10:00', '11:00', 'Faux', 'creer')$$,
  '42501', null, 'visitors cannot change the planning'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"91000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$update public.planning_slots set leader = 'Nouvelle animatrice' where title = 'Qi Gong'$$,
  'editors update the planning'
);
select throws_ok(
  $$insert into public.planning_slots (day, starts_at, ends_at, title, family) values (2, '16:00', '15:00', 'À l''envers', 'creer')$$,
  '23514', null, 'a slot cannot end before it starts'
);

select * from finish();
rollback;
