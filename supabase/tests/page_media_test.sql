begin;
select plan(4);

select is((select public::text || '|' || file_size_limit || '|' || array_to_string(allowed_mime_types, ',') from storage.buckets where id = 'page-media'), 'true|4194304|image/jpeg,image/png,image/webp,application/pdf', 'page-media bucket is public and takes photos and PDFs up to 4 MB');
select ok(public.is_valid_rich_content('{"type":"doc","content":[{"type":"image","attrs":{"src":"https://x.supabase.co/storage/v1/object/public/page-media/photo-abc.jpg","alt":"Un atelier"}}]}'), 'a photo of the page-media bucket is valid rich content');
select ok(not public.is_valid_rich_content('{"type":"doc","content":[{"type":"image","attrs":{"src":"https://example.com/a.jpg","alt":"Ailleurs"}}]}'), 'a photo from another site is refused');
select ok(not public.is_valid_rich_content('{"type":"doc","content":[{"type":"image","attrs":{"src":"https://x.supabase.co/storage/v1/object/public/page-media/photo-abc.jpg","alt":""}}]}'), 'a photo without a description is refused');

select * from finish();
rollback;
