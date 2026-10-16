begin;
select plan(16);

select has_table('public', 'planning_exceptions', 'planning_exceptions exists');
select is(
  (select recurrence || ':' || month_weeks::text from public.planning_slots where title = 'Soupe au caillou'),
  'only:{-1}', 'the soup takes place on the last Thursday'
);
select is(
  (select recurrence || ':' || month_weeks::text from public.planning_slots where title = 'GEM « Hors les murs »'),
  'except:{-1}', 'the outing takes place every Thursday but the last'
);
select is(
  (select recurrence || ':' || month_weeks::text from public.planning_slots where title = 'Collage'),
  'only:{1}', 'collage takes place on the first Saturday'
);
select is(
  (select count(*) from public.planning_slots where recurrence = 'weekly' and month_weeks = '{}'),
  8::bigint, 'the other slots stay weekly'
);
select throws_ok(
  $$update public.planning_slots set recurrence = 'only', month_weeks = '{}' where title = 'Qi Gong'$$,
  '23514', null, 'a monthly slot names its weeks'
);
select throws_ok(
  $$update public.planning_slots set recurrence = 'only', month_weeks = '{6}' where title = 'Qi Gong'$$,
  '23514', null, 'weeks of the month go from 1 to 5, or -1 for the last'
);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '92000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'exceptions-editor@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
insert into public.profiles (id, display_name, role, active) values ('92000000-0000-0000-0000-000000000001', 'Exceptions Editor', 'editor', true);

select set_config('request.jwt.claims', '{"sub":"92000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$insert into public.planning_exceptions (kind, date, slot_id, hidden, reason)
    select 'cancel', '2030-01-08', id, false, 'Animateur absent' from public.planning_slots where title = 'Qi Gong'$$,
  'editors cancel a session'
);
select lives_ok(
  $$insert into public.planning_exceptions (kind, date, end_date, reason) values ('closure', '2030-12-24', '2031-01-02', 'Fêtes de fin d''année')$$,
  'editors close the GEM for a period'
);
select lives_ok(
  $$insert into public.planning_exceptions (kind, date, starts_at, ends_at, title, family) values ('extra', '2030-01-09', '14:00', '16:00', 'Atelier invité', 'creer')$$,
  'editors add an exceptional session'
);
select throws_ok(
  $$insert into public.planning_exceptions (kind, date) values ('cancel', '2030-01-08')$$,
  '23514', null, 'a cancellation names its slot'
);
select throws_ok(
  $$insert into public.planning_exceptions (kind, date, end_date) values ('closure', '2030-01-10', '2030-01-09')$$,
  '23514', null, 'a closure cannot end before it starts'
);
select throws_ok(
  $$insert into public.planning_exceptions (kind, date, starts_at, ends_at, title, family) values ('extra', '2030-01-13', '14:00', '16:00', 'Dimanche', 'creer')$$,
  '23514', null, 'no session on a Sunday'
);
reset role;

set local role anon;
select is((select count(*) from public.planning_exceptions), 3::bigint, 'visitors read the exceptions');
select throws_ok(
  $$insert into public.planning_exceptions (kind, date, end_date) values ('closure', '2030-02-01', '2030-02-01')$$,
  '42501', null, 'visitors cannot change the exceptions'
);
reset role;

delete from public.planning_slots where title = 'Qi Gong';
select is(
  (select count(*) from public.planning_exceptions where kind = 'cancel'),
  0::bigint, 'removing a slot removes its cancellations'
);

select * from finish();
rollback;
