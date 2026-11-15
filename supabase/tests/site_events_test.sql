begin;
select plan(10);

select has_table('public', 'site_events', 'site_events table exists');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'e1000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'stats-admin@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e1000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'stats-editor@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
insert into public.profiles (id, display_name, role, active)
values ('e1000000-0000-0000-0000-000000000001', 'Stats Admin', 'admin', true), ('e1000000-0000-0000-0000-000000000002', 'Stats Editor', 'editor', true);
insert into public.audit_log (actor_id, action, entity_type) values ('e1000000-0000-0000-0000-000000000001', 'page.publish', 'page');

set local role anon;
select lives_ok($$select public.count_site_event('phone')$$, 'visitors count a phone tap');
select lives_ok($$select public.count_site_event('phone')$$, 'a second tap the same day');
select throws_ok($$select public.count_site_event('page_view')$$, '22023', null, 'an unknown gesture is refused');
select throws_ok($$select count(*) from public.site_events$$, '42501', null, 'visitors read no counter');
select throws_ok($$insert into public.site_events (day, event, count) values (current_date, 'map', 99)$$, '42501', null, 'visitors cannot write counters directly');
reset role;

select set_config('request.jwt.claims', '{"sub":"e1000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.site_events), 0::bigint, 'editors read no counter');
select is((select count(*) from public.audit_log), 0::bigint, 'editors read no team activity');
reset role;

select set_config('request.jwt.claims', '{"sub":"e1000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select is((select sum(count)::int from public.site_events where event = 'phone'), 2, 'administrators read the day total');
select is((select count(*) from public.audit_log where actor_id = 'e1000000-0000-0000-0000-000000000001'), 1::bigint, 'administrators read the team activity');
reset role;

select * from finish();
rollback;
