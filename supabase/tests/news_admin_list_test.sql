begin;
select plan(11);

select has_function('public', 'list_news_with_authors', array[]::text[], 'list_news_with_authors() exists');
select policies_are('public', 'profiles', array['profiles_read_self', 'profiles_admin_all'], 'profile policies remain least privilege');

select (to_regprocedure('public.list_news_with_authors()') is not null) as function_ready \gset
\if :function_ready

select ok(
  (select p.prosecdef from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'list_news_with_authors'),
  'the news list function is security definer'
);
select ok(
  (select p.proconfig @> array['search_path=""'] from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'list_news_with_authors'),
  'the news list function has an empty search path'
);
select is(
  (
    select array_agg(r.rolname::text order by r.rolname)::text[]
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    cross join lateral aclexplode(p.proacl) acl
    join pg_roles r on r.oid = acl.grantee
    where n.nspname = 'public'
      and p.proname = 'list_news_with_authors'
      and acl.privilege_type = 'EXECUTE'
      and acl.grantee <> p.proowner
  ),
  array['authenticated']::text[],
  'only authenticated receives execute permission'
);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '61000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'author-one@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '61000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'reader-two@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '61000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'inactive-three@gemjanus34.local', crypt('test-only-password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.profiles (id, display_name, role, active)
values
  ('61000000-0000-0000-0000-000000000001', 'Autrice collègue', 'editor', true),
  ('61000000-0000-0000-0000-000000000002', 'Lecteur actif', 'editor', true),
  ('61000000-0000-0000-0000-000000000003', 'Lecteur inactif', 'editor', false);

insert into public.news (id, title, excerpt, starts_at, created_by, updated_by)
values ('62000000-0000-0000-0000-000000000001', 'Actualité partagée', 'Résumé', '2026-10-16T08:30:00Z', '61000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001');

set local role anon;
select throws_like($$select * from public.list_news_with_authors()$$, '%permission denied%', 'anonymous users cannot execute the news list');
reset role;

select set_config('request.jwt.claims', '{"sub":"61000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select throws_like($$select * from public.list_news_with_authors()$$, '%active editor%', 'inactive users cannot execute the news list');
reset role;

select set_config('request.jwt.claims', '{"sub":"61000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select results_eq($$select display_name from public.profiles order by display_name$$, array['Lecteur actif'], 'editors still read only their own profile row');
select results_eq(
  $$select title, author_display_name from public.list_news_with_authors() order by title$$,
  $$values ('Actualité partagée'::text, 'Autrice collègue'::text)$$,
  'active editors see another author display name through the narrow news list'
);
reset role;

select is((select count(*) from public.profiles where id::text like '61000000-%'), 3::bigint, 'the test owner retains all fixture profile rows');
select is((select count(*) from public.news where id = '62000000-0000-0000-0000-000000000001'), 1::bigint, 'the news list does not mutate content');

\else

select fail('the news list function is security definer');
select fail('the news list function has an empty search path');
select fail('only authenticated receives execute permission');
select fail('anonymous users cannot execute the news list');
select fail('inactive users cannot execute the news list');
select fail('editors still read only their own profile row');
select fail('active editors see another author display name through the narrow news list');
select fail('the test owner retains all profile rows');
select fail('the news list does not mutate content');

\endif

select * from finish();
rollback;
