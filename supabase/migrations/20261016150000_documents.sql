-- Public documents (planning, statutes, health guides) managed from the admin.
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  description text not null check (char_length(description) between 1 and 300),
  category text not null check (category in ('planning', 'institutional', 'health', 'activity')),
  document_date date not null,
  url text not null check (url ~ '^(/|https?://)'),
  -- Null for the PDFs shipped with the site under /documents.
  storage_path text unique,
  -- Null for the PDFs imported by this migration.
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy documents_public_read
on public.documents
for select
to anon, authenticated
using (true);

create policy documents_editor_insert
on public.documents
for insert
to authenticated
with check (public.is_active_editor());

create policy documents_editor_delete
on public.documents
for delete
to authenticated
using (public.is_active_editor());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', true, 4194304, array['application/pdf'])
on conflict (id) do nothing;

create policy documents_bucket_editor_read
on storage.objects
for select
to authenticated
using (bucket_id = 'documents' and public.is_active_editor());

create policy documents_bucket_editor_insert
on storage.objects
for insert
to authenticated
with check (bucket_id = 'documents' and public.is_active_editor());

create policy documents_bucket_editor_delete
on storage.objects
for delete
to authenticated
using (bucket_id = 'documents' and public.is_active_editor());

insert into public.documents (title, description, category, document_date, url)
values
  ('Planning des activités', 'Le planning hebdomadaire des ateliers et des temps collectifs, en vigueur à partir du 22 juin 2026.', 'planning', '2026-06-22', '/documents/planning-des-activites.pdf'),
  ('Statuts de l''association', 'Les statuts de Janus34, version d''avril 2009.', 'institutional', '2009-04-01', '/documents/statuts-association.pdf'),
  ('Règlement intérieur', 'Le règlement intérieur de l''association, version de mai 2021.', 'institutional', '2021-05-01', '/documents/reglement-interieur.pdf'),
  ('Règles de vie', 'Les rappels pour faciliter le vivre ensemble au GEM.', 'institutional', '2019-01-01', '/documents/regles-de-vie.pdf'),
  ('Compte rendu de l''assemblée générale 2025', 'Le compte rendu de l''assemblée générale du 10 mai 2025.', 'institutional', '2025-05-10', '/documents/compte-rendu-ag-2025.pdf'),
  ('Questions et réponses sur les troubles bipolaires', 'Un document d''information générale pour mieux comprendre les troubles bipolaires.', 'health', '2013-09-01', '/documents/questions-reponses-troubles-bipolaires.pdf'),
  ('Le trouble bipolaire : le connaître pour mieux le reconnaître', 'Un document de sensibilisation sur les signes du trouble bipolaire.', 'health', '2013-09-01', '/documents/connaitre-trouble-bipolaire.pdf'),
  ('Apprendre à vivre avec des troubles bipolaires', 'Un guide à l''usage des personnes concernées et de leurs proches.', 'health', '2013-09-01', '/documents/vivre-avec-troubles-bipolaires.pdf'),
  ('Conseils à l''entourage', 'Des repères pour les proches d''une personne concernée.', 'health', '2013-09-01', '/documents/conseils-entourage.pdf'),
  ('Diagramme de l''humeur', 'Un outil, avec ses instructions, pour suivre l''évolution de l''humeur.', 'health', '2013-09-01', '/documents/diagramme-humeur.pdf');
