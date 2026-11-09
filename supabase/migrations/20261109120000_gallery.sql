-- Gallery of the workshops' creations, published with the author's consent and shown only once switched on.
alter table public.site_settings add column gallery_enabled boolean not null default false;
grant update (gallery_enabled) on public.site_settings to authenticated;

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  author text check (author is null or char_length(author) between 1 and 80),
  workshop text check (workshop is null or char_length(workshop) between 1 and 80),
  image_path text not null,
  image_url text not null,
  consent boolean not null check (consent),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.gallery_items enable row level security;

-- Visitors cannot call is_active_editor(), hence a policy of their own.
create policy gallery_items_public_read on public.gallery_items for select to anon
  using ((select s.gallery_enabled from public.site_settings as s));
create policy gallery_items_team_read on public.gallery_items for select to authenticated
  using ((select s.gallery_enabled from public.site_settings as s) or public.is_active_editor());
create policy gallery_items_editor_insert on public.gallery_items for insert to authenticated
  with check (public.is_active_editor() and created_by = auth.uid());
create policy gallery_items_editor_delete on public.gallery_items for delete to authenticated
  using (public.is_active_editor());

revoke all on public.gallery_items from anon, authenticated;
grant select on public.gallery_items to anon, authenticated;
grant insert (title, author, workshop, image_path, image_url, consent, created_by), delete on public.gallery_items to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery', 'gallery', true, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy gallery_bucket_editor_read on storage.objects for select to authenticated
  using (bucket_id = 'gallery' and public.is_active_editor());
create policy gallery_bucket_editor_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery' and public.is_active_editor());
create policy gallery_bucket_editor_delete on storage.objects for delete to authenticated
  using (bucket_id = 'gallery' and public.is_active_editor());
