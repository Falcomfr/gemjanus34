begin;
select plan(5);

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

select ok(
  (select content::text like '%numéro de téléphone%' and content::text like '%Resend%' from public.pages where slug = 'confidentialite'),
  'the privacy page covers the call-me-back form and the e-mail copy'
);
select ok(
  (select content::text like '%Cloudflare Web Analytics%' and content::text like '%90 jours%' from public.pages where slug = 'confidentialite'),
  'the privacy page covers the visit statistics and the backups'
);

select * from finish();
rollback;
