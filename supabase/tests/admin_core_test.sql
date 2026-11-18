begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public;

select plan(96);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'pages', 'pages table exists');
select has_table('public', 'page_revisions', 'page_revisions table exists');
select has_table('public', 'news', 'news table exists');
select has_table('public', 'audit_log', 'audit_log table exists');
select policies_are(
  'public',
  'profiles',
  array['profiles_read_self', 'profiles_admin_all']
);
select policies_are(
  'public',
  'pages',
  array['pages_public_read', 'pages_editor_write', 'pages_admin_delete_archived']
);
select policies_are(
  'public',
  'page_revisions',
  array['page_revisions_manager_read']
);
select policies_are(
  'public',
  'news',
  array['news_public_read', 'news_editor_write', 'news_manager_delete_archived']
);
select function_returns('public', 'current_app_role', array[]::text[], 'app_role');
select function_returns('public', 'is_active_editor', array[]::text[], 'boolean');
select function_returns('public', 'is_admin', array[]::text[], 'boolean');
select col_is_unique('public', 'pages', 'slug', 'page slugs are unique');

select enum_has_labels(
  'public',
  'app_role',
  array['admin', 'editor', 'manager'],
  'app_role has admin, editor and manager values'
);
select enum_has_labels(
  'public',
  'content_status',
  array['draft', 'published', 'archived'],
  'content_status has the required lifecycle values'
);
select is(
  (
    select count(*)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('profiles', 'pages', 'page_revisions', 'news', 'audit_log')
      and c.relrowsecurity
  ),
  5::bigint,
  'RLS is enabled on every admin core table'
);
select is(
  (
    select count(*)
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'audit_log'
      and p.polname <> 'audit_log_admin_read'
  ),
  0::bigint,
  'audit events have no direct client policies besides the administrators'' read'
);
select is(
  (
    select count(*)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'current_app_role',
        'is_active_editor',
        'is_admin',
        'publish_page',
        'restore_page_revision'
      )
      and p.prosecdef
  ),
  5::bigint,
  'all privileged functions are security definer'
);
select is(
  (
    select count(*)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'current_app_role',
        'is_active_editor',
        'is_admin',
        'publish_page',
        'restore_page_revision'
      )
      and p.proconfig @> array['search_path=""']
  ),
  5::bigint,
  'all privileged functions use an empty search_path'
);
select ok(
  to_regprocedure('public.publish_page(uuid)') is not null,
  'publish_page(uuid) exists'
);
select ok(
  to_regprocedure('public.restore_page_revision(uuid)') is not null,
  'restore_page_revision(uuid) exists'
);
select ok(
  exists (
    select 1
    from auth.users
    where email = 'admin@gemjanus34.local'
      and confirmation_token is not null
      and recovery_token is not null
      and email_change_token_new is not null
      and email_change is not null
  ),
  'the local bootstrap user is readable by GoTrue password authentication'
);
select ok(
  public.is_valid_rich_content(
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Titre","marks":[{"type":"bold"},{"type":"textStyle","attrs":{"color":"#185c4c"}}]}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Element","marks":[{"type":"link","attrs":{"href":"/ressources","target":null,"rel":null,"class":null}}]}]}]}]}]}'::jsonb
  ),
  'the database accepts the supported rich-content vocabulary'
);
select ok(
  public.is_valid_rich_content(
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Site","marks":[{"type":"link","attrs":{"href":"https://gemjanus34.fr/contact"}}]}]}]}'::jsonb
  ),
  'the database accepts HTTPS links'
);
select ok(
  public.is_valid_rich_content(
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Courriel","marks":[{"type":"link","attrs":{"href":"mailto:contact@gemjanus34.fr"}}]}]}]}'::jsonb
  ),
  'the database accepts mail links'
);
select ok(
  not public.is_valid_rich_content(
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Site","marks":[{"type":"link","attrs":{"href":"https://gemjanus34.fr","target":"_blank","rel":"noopener noreferrer nofollow","class":null,"title":null}}]}]}]}'::jsonb
  ),
  'the database rejects the automatic Tiptap link title attribute'
);
select ok(
  not public.is_valid_rich_content(
    '{"type":"doc","content":[{"type":"heading","attrs":{"level":1}}]}'::jsonb
  ),
  'the database rejects heading level one'
);
select ok(
  not public.is_valid_rich_content(
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Lien","marks":[{"type":"link","attrs":{"href":"javascript:alert(1)"}}]}]}]}'::jsonb
  ),
  'the database rejects javascript links'
);
select ok(
  not public.is_valid_rich_content(
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Lien","marks":[{"type":"link","attrs":{"href":"JaVaScRiPt:alert(1)"}}]}]}]}'::jsonb
  ),
  'the database rejects mixed-case javascript links'
);
select ok(
  not public.is_valid_rich_content(
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Lien","marks":[{"type":"link","attrs":{"href":"\n\tjavascript:alert(1)"}}]}]}]}'::jsonb
  ),
  'the database rejects javascript links after ASCII whitespace'
);
select ok(
  not public.is_valid_rich_content(
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Lien","marks":[{"type":"link","attrs":{"href":"java\tscript:alert(1)"}}]}]}]}'::jsonb
  ),
  'the database rejects javascript links containing an embedded tab'
);
select ok(
  not public.is_valid_rich_content(
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Lien","marks":[{"type":"link","attrs":{"href":"java\nscript:alert(1)"}}]}]}]}'::jsonb
  ),
  'the database rejects javascript links containing an embedded newline'
);
select ok(
  not public.is_valid_rich_content(
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Couleur","marks":[{"type":"textStyle","attrs":{"color":"#ffffff"}}]}]}]}'::jsonb
  ),
  'the database rejects colors outside the editor palette'
);

select (
  to_regclass('public.profiles') is not null
  and to_regclass('public.pages') is not null
  and to_regclass('public.news') is not null
  and to_regprocedure('public.publish_page(uuid)') is not null
  and to_regprocedure('public.restore_page_revision(uuid)') is not null
) as schema_ready \gset

\if :schema_ready

truncate table
  public.audit_log,
  public.page_revisions,
  public.news,
  public.pages,
  public.profiles
restart identity cascade;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'admin-test@gemjanus34.local',
    crypt('test-only-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'editor-test@gemjanus34.local',
    crypt('test-only-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'inactive-test@gemjanus34.local',
    crypt('test-only-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  );

insert into public.profiles (id, display_name, role, active)
values
  ('10000000-0000-0000-0000-000000000001', 'Admin Test', 'admin', true),
  ('10000000-0000-0000-0000-000000000002', 'Editor Test', 'editor', true),
  ('10000000-0000-0000-0000-000000000003', 'Inactive Test', 'editor', false);

insert into public.pages (
  id,
  slug,
  title,
  summary,
  content,
  status,
  created_by,
  updated_by
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    'published-page',
    'Published page',
    'Visible to everyone',
    '{"type":"doc","content":[]}',
    'published',
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'draft-page',
    'Draft page',
    'Visible to editors',
    '{"type":"doc","content":[]}',
    'draft',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002'
  );

insert into public.page_revisions (
  id,
  page_id,
  title,
  summary,
  content,
  status,
  created_by
)
values (
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Restorable title',
  'Restorable summary',
  '{"type":"doc","content":[{"type":"paragraph"}]}',
  'published',
  '10000000-0000-0000-0000-000000000001'
);

select lives_ok(
  $$
    update public.pages
    set content = '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Site","marks":[{"type":"link","attrs":{"href":"https://gemjanus34.fr","target":"_blank","rel":"noopener noreferrer nofollow","class":null}}]}]}]}'::jsonb
    where id = '20000000-0000-0000-0000-000000000002'
  $$,
  'the persistence boundary accepts normalized Tiptap link attributes'
);
select is(
  (select content from public.pages where id = '20000000-0000-0000-0000-000000000002'),
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Site","marks":[{"type":"link","attrs":{"href":"https://gemjanus34.fr","target":"_blank","rel":"noopener noreferrer nofollow","class":null}}]}]}]}'::jsonb,
  'normalized Tiptap link attributes persist unchanged'
);

insert into public.news (
  id,
  title,
  excerpt,
  starts_at,
  status,
  created_by,
  updated_by
)
values
  (
    '40000000-0000-0000-0000-000000000001',
    'Published news',
    'Visible to everyone',
    now(),
    'published',
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    'Draft news',
    'Visible to editors',
    now(),
    'draft',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002'
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    'Archived news',
    'Only administrators may restore this item',
    now(),
    'archived',
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '40000000-0000-0000-0000-000000000004',
    'Immutable id news',
    'Its technical identifier must not change',
    now(),
    'draft',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002'
  ),
  (
    '40000000-0000-0000-0000-000000000005',
    'Admin publication news',
    'This draft is reserved for the admin publication test',
    now(),
    'draft',
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001'
  );

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select results_eq(
  $$select slug from public.pages order by slug$$,
  array['published-page'],
  'anonymous users read only published pages'
);
select results_eq(
  $$select title from public.news order by title$$,
  array['Published news'],
  'anonymous users read only published news'
);
select throws_like(
  $$
    insert into public.pages (
      slug, title, created_by, updated_by
    ) values (
      'anonymous-page',
      'Anonymous page',
      '10000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001'
    )
  $$,
  '%row-level security%',
  'anonymous users cannot create pages'
);
select throws_like(
  $$select public.publish_page('20000000-0000-0000-0000-000000000002')$$,
  '%permission denied%',
  'anonymous users cannot publish pages'
);
select throws_like(
  $$select public.restore_page_revision('30000000-0000-0000-0000-000000000001')$$,
  '%permission denied%',
  'anonymous users cannot restore page revisions'
);
reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);
set local role authenticated;
select is(public.current_app_role(), 'editor'::public.app_role, 'editor role is resolved');
select ok(public.is_active_editor(), 'active editors pass the editor check');
select ok(not public.is_admin(), 'editors do not pass the admin check');
select throws_like(
  $$
    insert into private.page_publication_context (transaction_id, actor_id)
    values (pg_catalog.txid_current(), '10000000-0000-0000-0000-000000000002')
  $$,
  '%permission denied%',
  'authenticated callers cannot forge publication context'
);
select results_eq(
  $$select display_name from public.profiles$$,
  array['Editor Test'],
  'editors read only their own active profile'
);
select is(
  (select count(*) from public.pages),
  2::bigint,
  'active editors can read published and draft pages'
);
select lives_ok(
  $$
    insert into public.pages (
      slug, title, created_by, updated_by
    ) values (
      'editor-page',
      'Editor page',
      '10000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000002'
    )
  $$,
  'active editors can create pages'
);
select lives_ok(
  $$
    update public.pages
    set
      title = 'Draft page edited',
      summary = 'Editorial changes are allowed',
      content = '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Edited"}]}]}'
    where id = '20000000-0000-0000-0000-000000000002'
  $$,
  'active editors can update editorial page fields'
);
select throws_like(
  $$
    update public.pages
    set
      title = 'Published page changed',
      updated_by = '10000000-0000-0000-0000-000000000002'
    where id = '20000000-0000-0000-0000-000000000001'
  $$,
  '%administrator%',
  'editors cannot change a page that is already published'
);
select throws_like(
  $$update public.pages set id = '20000000-0000-0000-0000-000000000099' where id = '20000000-0000-0000-0000-000000000002'$$,
  '%id cannot be changed%',
  'page identifiers are immutable'
);
select throws_like(
  $$update public.pages set slug = 'editor-renamed-page' where id = '20000000-0000-0000-0000-000000000002'$$,
  '%administrator%',
  'editors cannot change page slugs'
);
select throws_like(
  $$update public.pages set navigation_position = 3 where id = '20000000-0000-0000-0000-000000000002'$$,
  '%administrator%',
  'editors cannot change navigation position'
);
select throws_like(
  $$update public.pages set parent_id = '20000000-0000-0000-0000-000000000001' where id = '20000000-0000-0000-0000-000000000002'$$,
  '%administrator%',
  'editors cannot change page hierarchy'
);
select throws_like(
  $$update public.pages set status = 'published' where id = '20000000-0000-0000-0000-000000000002'$$,
  '%publication RPC%',
  'editors cannot publish pages directly'
);
select throws_like(
  $$update public.pages set created_by = '10000000-0000-0000-0000-000000000001' where id = '20000000-0000-0000-0000-000000000002'$$,
  '%created_by%',
  'editors cannot spoof page creators'
);
select throws_like(
  $$update public.pages set updated_by = '10000000-0000-0000-0000-000000000001' where id = '20000000-0000-0000-0000-000000000002'$$,
  '%updated_by%',
  'editors cannot spoof page updaters'
);
select throws_like(
  $$update public.pages set content = '{"type":"script"}' where id = '20000000-0000-0000-0000-000000000002'$$,
  '%valid Tiptap%',
  'editors cannot store unsupported page content'
);
select throws_like(
  $$update public.news set content = '{"type":"script"}' where id = '40000000-0000-0000-0000-000000000002'$$,
  '%valid Tiptap%',
  'editors cannot store unsupported news content'
);
select throws_like(
  $$
    insert into public.news (
      title, excerpt, starts_at, status, created_by, updated_by
    ) values (
      'Directly published news',
      'This must remain a deliberate publication action',
      now(),
      'published',
      '10000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000002'
    )
  $$,
  '%publication RPC%',
  'editors cannot insert already-published news'
);
select throws_like(
  $$
    update public.news
    set
      title = 'Published news changed',
      updated_by = '10000000-0000-0000-0000-000000000002'
    where id = '40000000-0000-0000-0000-000000000001'
  $$,
  '%draft%',
  'editors cannot change published news'
);
select throws_like(
  $$
    update public.news
    set
      status = 'published',
      updated_by = '10000000-0000-0000-0000-000000000002'
    where id = '40000000-0000-0000-0000-000000000003'
  $$,
  '%restoration RPC%',
  'editors cannot unarchive news'
);
select throws_like(
  $$
    update public.news
    set
      status = 'published',
      updated_by = '10000000-0000-0000-0000-000000000002'
    where id = '40000000-0000-0000-0000-000000000002'
  $$,
  '%publication RPC%',
  'editors cannot publish news'
);
select throws_like(
  $$update public.news set id = '40000000-0000-0000-0000-000000000099' where id = '40000000-0000-0000-0000-000000000004'$$,
  '%id cannot be changed%',
  'news identifiers are immutable'
);
delete from public.pages where slug = 'editor-page';
select ok(
  exists (select 1 from public.pages where slug = 'editor-page'),
  'editors cannot delete pages'
);
delete from public.news where id = '40000000-0000-0000-0000-000000000002';
select ok(
  exists (select 1 from public.news where id = '40000000-0000-0000-0000-000000000002'),
  'editors cannot delete news'
);
update public.profiles
set display_name = 'Changed by editor'
where id = '10000000-0000-0000-0000-000000000001';
reset role;
select is(
  (
    select display_name
    from public.profiles
    where id = '10000000-0000-0000-0000-000000000001'
  ),
  'Admin Test',
  'editors cannot administer profiles'
);
set local role authenticated;
select is(
  (select count(*) from public.page_revisions),
  0::bigint,
  'editors cannot directly read revisions'
);
select is(
  (select count(*) from public.audit_log),
  0::bigint,
  'editors cannot directly read audit events'
);
select throws_like(
  $$select public.restore_page_revision('30000000-0000-0000-0000-000000000001')$$,
  '%administrator%',
  'editors cannot restore revisions'
);
select throws_like(
  $$select public.publish_page('20000000-0000-0000-0000-000000000002')$$,
  '%administrator%',
  'editors cannot publish pages through the RPC'
);
reset role;

select is(
  (select status from public.pages where id = '20000000-0000-0000-0000-000000000002'),
  'draft'::public.content_status,
  'rejected editor publication leaves page status unchanged'
);
select is(
  (
    select count(*)
    from public.page_revisions
    where page_id = '20000000-0000-0000-0000-000000000002'
  ),
  0::bigint,
  'rejected editor publication creates no revision'
);
select is(
  (
    select count(*)
    from public.audit_log
    where action = 'page.publish'
      and entity_type = 'page'
      and entity_id = '20000000-0000-0000-0000-000000000002'
      and actor_id = '10000000-0000-0000-0000-000000000002'
  ),
  0::bigint,
  'rejected editor publication creates no audit event'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);
set local role authenticated;
select ok(not public.is_active_editor(), 'inactive editors fail the editor check');
select is(
  (select count(*) from public.profiles),
  0::bigint,
  'inactive users cannot read their own profile'
);
select throws_like(
  $$
    insert into public.news (
      title, excerpt, starts_at, created_by, updated_by
    ) values (
      'Inactive editor news',
      'This insert must be rejected',
      now(),
      '10000000-0000-0000-0000-000000000003',
      '10000000-0000-0000-0000-000000000003'
    )
  $$,
  '%row-level security%',
  'inactive editors cannot create news'
);
select throws_like(
  $$select public.publish_page('20000000-0000-0000-0000-000000000002')$$,
  '%administrator%',
  'inactive editors cannot publish pages'
);
reset role;

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);
set local role authenticated;
select ok(public.is_admin(), 'admin role is resolved');
select is(
  (select count(*) from public.page_revisions),
  1::bigint,
  'admins can read page revisions'
);
select is(
  (select count(*) from public.profiles),
  3::bigint,
  'admins can read all profiles'
);
update public.profiles
set notify_on_publish = false
where id = '10000000-0000-0000-0000-000000000002';
select is(
  (
    select notify_on_publish
    from public.profiles
    where id = '10000000-0000-0000-0000-000000000002'
  ),
  false,
  'admins can manage profiles'
);
select lives_ok(
  $$
    update public.pages
    set
      navigation_position = 2,
      updated_by = '10000000-0000-0000-0000-000000000001'
    where id = '20000000-0000-0000-0000-000000000002'
  $$,
  'admins can manage page navigation'
);
select throws_like(
  $$
    update public.pages
    set
      title = 'Published page changed by admin',
      updated_by = '10000000-0000-0000-0000-000000000001'
    where id = '20000000-0000-0000-0000-000000000001'
  $$,
  '%publication workflow%',
  'admins cannot change live page content outside the publication workflow'
);
select set_config('app.page_publication', 'on', true);
select throws_like(
  $$
    update public.pages
    set
      status = 'published',
      published_at = now(),
      updated_by = '10000000-0000-0000-0000-000000000001'
    where slug = 'editor-page'
  $$,
  '%publication RPC%',
  'a caller-controlled GUC cannot bypass the publication RPC'
);
select set_config('app.page_publication', 'off', true);
select throws_like(
  $$
    update public.pages
    set
      status = 'published',
      updated_by = '10000000-0000-0000-0000-000000000001'
    where id = '20000000-0000-0000-0000-000000000002'
  $$,
  '%publication RPC%',
  'admins cannot bypass the publication workflow'
);
select lives_ok(
  $$select public.publish_page('20000000-0000-0000-0000-000000000002')$$,
  'admins can publish pages through the RPC'
);
select lives_ok(
  $$select public.publish_news('40000000-0000-0000-0000-000000000005')$$,
  'admins can publish news through the RPC'
);
delete from public.pages where id = '20000000-0000-0000-0000-000000000002';
select ok(
  exists (select 1 from public.pages where id = '20000000-0000-0000-0000-000000000002'),
  'admins archive a page before deleting it'
);
delete from public.news where id = '40000000-0000-0000-0000-000000000001';
select ok(
  exists (select 1 from public.news where id = '40000000-0000-0000-0000-000000000001'),
  'admins archive news before deleting it'
);
select lives_ok(
  $$select public.restore_page_revision('30000000-0000-0000-0000-000000000001')$$,
  'admins can restore page revisions'
);
reset role;

select is(
  (select status from public.pages where id = '20000000-0000-0000-0000-000000000002'),
  'published'::public.content_status,
  'administrator publication changes page status'
);
select ok(
  exists (
    select 1
    from public.page_revisions
    where page_id = '20000000-0000-0000-0000-000000000002'
      and title = 'Draft page edited'
      and summary = 'Editorial changes are allowed'
      and content = '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Edited"}]}]}'::jsonb
      and status = 'published'
      and created_by = '10000000-0000-0000-0000-000000000001'
  ),
  'administrator publication records the complete published revision'
);
select is(
  (
    select count(*)
    from public.audit_log
    where action = 'page.publish'
      and entity_type = 'page'
      and entity_id = '20000000-0000-0000-0000-000000000002'
      and actor_id = '10000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'administrator publication records an audit event'
);

select results_eq(
  $$
    select title, summary, content, status::text
    from public.pages
    where id = '20000000-0000-0000-0000-000000000001'
  $$,
  $$
    values (
      'Restorable title'::text,
      'Restorable summary'::text,
      '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
      'published'::text
    )
  $$,
  'restoration copies all revision fields back to the page'
);
select is(
  (
    select count(*)
    from public.page_revisions
    where page_id = '20000000-0000-0000-0000-000000000001'
  ),
  2::bigint,
  'restoration creates a new immutable revision'
);
select is(
  (
    select count(*)
    from public.audit_log
    where action = 'page.restore'
      and entity_type = 'page'
      and entity_id = '20000000-0000-0000-0000-000000000001'
      and actor_id = '10000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'restoration records an audit event'
);

\else

select fail('anonymous users read only published pages');
select fail('anonymous users read only published news');
select fail('the persistence boundary accepts normalized Tiptap link attributes');
select fail('normalized Tiptap link attributes persist unchanged');
select fail('anonymous users cannot create pages');
select fail('editor role is resolved');
select fail('active editors pass the editor check');
select fail('editors do not pass the admin check');
select fail('editors read only their own active profile');
select fail('active editors can read published and draft pages');
select fail('active editors can create pages');
select fail('editors cannot administer profiles');
select fail('editors cannot directly read revisions');
select fail('editors cannot directly read audit events');
select fail('editors cannot restore revisions');
select fail('active editors can publish pages');
select fail('publishing changes page status');
select fail('publishing records the complete published revision');
select fail('publishing records an audit event');
select fail('inactive editors fail the editor check');
select fail('inactive users cannot read their own profile');
select fail('inactive editors cannot create news');
select fail('admin role is resolved');
select fail('admins can read all profiles');
select fail('admins can manage profiles');
select fail('admins can restore page revisions');
select fail('restoration copies all revision fields back to the page');
select fail('restoration creates a new immutable revision');
select fail('restoration records an audit event');

\endif

select * from finish();
rollback;
