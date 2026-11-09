begin;
select plan(14);

select has_table('public', 'contact_messages', 'contact_messages table exists');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '71000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'messages-editor@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
insert into public.profiles (id, display_name, role, active) values ('71000000-0000-0000-0000-000000000001', 'Messages Editor', 'editor', true);

set local role anon;
select lives_ok(
  $$insert into public.contact_messages (name, email, subject, message) values ('Camille', 'camille@example.test', 'Première visite', 'Bonjour, je voudrais venir découvrir le GEM.')$$,
  'visitors can send a message'
);
select throws_ok($$select count(*) from public.contact_messages$$, '42501', null, 'visitors cannot read messages');
select throws_ok(
  $$insert into public.contact_messages (name, email, subject, message, handled_at) values ('Camille', 'camille@example.test', 'Sujet', 'Un message suffisamment long.', now())$$,
  '42501', null, 'visitors cannot mark a message as handled'
);
select throws_ok(
  $$insert into public.contact_messages (name, email, subject, message, created_at) values ('Camille', 'camille@example.test', 'Sujet', 'Un message suffisamment long.', '2099-01-01')$$,
  '42501', null, 'visitors cannot choose the date of their message'
);
select throws_ok(
  $$insert into public.contact_messages (name, email, subject, message) values ('Camille', 'a@b.c?cc=x@y.z', 'Sujet', 'Un message suffisamment long.')$$,
  '23514', null, 'e-mail addresses that would inject mail headers are rejected'
);
select throws_ok(
  $$insert into public.contact_messages (name, email, subject, message) values ('C', 'c@e.t', 'S', 'court')$$,
  '23514', null, 'too short messages are rejected'
);
select lives_ok(
  $$insert into public.contact_messages (kind, name, phone, message) values ('callback', 'Sam', '06 12 34 56 78', 'Le matin')$$,
  'visitors ask to be called back'
);
select throws_ok(
  $$insert into public.contact_messages (kind, name, phone, email, message) values ('callback', 'Sam', '06 12 34 56 78', 'sam@example.test', '')$$,
  '23514', null, 'a call-me-back request carries no e-mail'
);
select throws_ok(
  $$insert into public.contact_messages (kind, name, phone, message) values ('callback', 'Sam', 'abc', '')$$,
  '23514', null, 'a call-me-back request needs a phone number'
);
select throws_ok(
  $$insert into public.contact_messages (name, subject, message) values ('Camille', 'Sujet', 'Un message suffisamment long.')$$,
  '23514', null, 'a message still needs an e-mail address'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"71000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*) from public.contact_messages where email = 'camille@example.test'), 1::bigint, 'editors read messages');
select lives_ok($$update public.contact_messages set handled_at = now(), handled_by = '71000000-0000-0000-0000-000000000001' where email = 'camille@example.test'$$, 'editors mark messages as handled');
select lives_ok($$delete from public.contact_messages where email = 'camille@example.test'$$, 'editors delete messages');

select * from finish();
rollback;
