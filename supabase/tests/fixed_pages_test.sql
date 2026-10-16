begin;
select plan(2);

select is(
  (select count(*) from public.pages
   where slug in ('qui-sommes-nous', 'activites', 'nous-rejoindre', 'ressources', 'mentions-legales', 'confidentialite')
     and status = 'published'),
  6::bigint,
  'the six site pages are stored and published'
);
select ok(
  (select public.is_valid_rich_content(content) from public.pages where slug = 'ressources'),
  'stored site pages hold valid editor content'
);

select * from finish();
rollback;
