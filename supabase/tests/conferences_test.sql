begin;
select plan(18);

select is((select conferences_enabled::text || '|' || registrations_enabled::text from public.site_settings), 'false|false', 'the conferences and their registrations start switched off');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'e1000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'conf-editor@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
insert into public.profiles (id, display_name, role, active) values ('e1000000-0000-0000-0000-000000000001', 'Conf Editor', 'editor', true);

insert into public.conferences (id, title, speaker, starts_at, place, description, capacity, created_by) values
  ('e2000000-0000-0000-0000-000000000001', 'Le sommeil', 'Dr Martin', now() + interval '10 days', '405 rue des Grèzes', '', 3, 'e1000000-0000-0000-0000-000000000001'),
  ('e2000000-0000-0000-0000-000000000002', 'Passée', null, now() - interval '1 day', '405 rue des Grèzes', '', 10, 'e1000000-0000-0000-0000-000000000001'),
  ('e2000000-0000-0000-0000-000000000003', 'Sans limite', null, now() + interval '20 days', '405 rue des Grèzes', '', null, 'e1000000-0000-0000-0000-000000000001');

set local role anon;
select is((select count(*) from public.conferences), 0::bigint, 'visitors see no conference while the page is off');
select is(public.register_for_conference('e2000000-0000-0000-0000-000000000001', 'Camille', '06 12 34 56 78', 1), 'closed', 'registering is refused while switched off');
select is((select count(*) from public.conference_seats_taken()), 0::bigint, 'no seat count while the page is off');
reset role;

update public.site_settings set conferences_enabled = true;
set local role anon;
select is((select count(*) from public.conferences), 3::bigint, 'visitors see the conferences once the page is on');
select is(public.register_for_conference('e2000000-0000-0000-0000-000000000001', 'Camille', '06 12 34 56 78', 1), 'closed', 'registrations stay closed until switched on');
reset role;

update public.site_settings set registrations_enabled = true;
set local role anon;
select is(public.register_for_conference('e2000000-0000-0000-0000-000000000001', 'Camille', '06 12 34 56 78', 2), 'ok', 'a visitor books two seats');
select is(public.register_for_conference('e2000000-0000-0000-0000-000000000001', 'Sam', 'sam@example.test', 2), 'full', 'more seats than are left are refused');
select is(public.register_for_conference('e2000000-0000-0000-0000-000000000001', 'Sam', 'sam@example.test', 1), 'ok', 'the last seat can still be booked');
select is(public.register_for_conference('e2000000-0000-0000-0000-000000000002', 'Lou', 'lou@example.test', 1), 'past', 'a past conference takes no registration');
select is(public.register_for_conference('e2000000-0000-0000-0000-000000000003', 'Lou', 'lou@example.test', 4), 'ok', 'a conference without limit always accepts');
select is(public.register_for_conference('e2000000-0000-0000-0000-000000000003', 'L', 'x', 9), 'invalid', 'a too short name, contact or too many seats are refused');
select is((select seats from public.conference_seats_taken() where conference_id = 'e2000000-0000-0000-0000-000000000001'), 3::bigint, 'visitors see how many seats are taken');
select throws_ok($$select count(*) from public.conference_registrations$$, '42501', null, 'visitors never read the registrations');
select throws_ok($$insert into public.conference_registrations (conference_id, name, contact, seats) values ('e2000000-0000-0000-0000-000000000003', 'Pirate', 'p@example.test', 1)$$, '42501', null, 'visitors cannot write a registration directly');
reset role;

select set_config('request.jwt.claims', '{"sub":"e1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.conference_registrations), 3::bigint, 'the team reads the registrations');
select lives_ok($$delete from public.conferences where id = 'e2000000-0000-0000-0000-000000000001'$$, 'the team removes a conference');
reset role;
select is((select count(*) from public.conference_registrations where conference_id = 'e2000000-0000-0000-0000-000000000001'), 0::bigint, 'its registrations go with it');

select * from finish();
rollback;
