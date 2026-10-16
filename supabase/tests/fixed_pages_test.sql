begin;
select plan(3);

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

select ok(
  (select content::text like '%"Vidéos et carte"%' from public.pages where slug = 'confidentialite'),
  'the privacy page explains the videos and the map loaded on request'
);

select * from finish();
rollback;
