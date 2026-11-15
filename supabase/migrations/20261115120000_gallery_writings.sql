-- Writings in the gallery: a pasted text, or a PDF stored like the photos.
-- image_path/image_url keep their names (renaming would break the live site until the deploy) and hold the photo or the PDF.
alter table public.gallery_items
  add column kind text not null default 'image' check (kind in ('image', 'text', 'pdf')),
  add column body text check (body is null or char_length(body) between 1 and 20000),
  alter column image_path drop not null,
  alter column image_url drop not null,
  add constraint gallery_items_content check (
    case when kind = 'text' then body is not null and image_path is null and image_url is null
    else body is null and image_path is not null and image_url is not null end
  );

grant insert (kind, body) on public.gallery_items to authenticated;

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
where id = 'gallery';
