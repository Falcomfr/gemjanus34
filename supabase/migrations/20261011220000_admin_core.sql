create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'editor');
create type public.content_status as enum ('draft', 'published', 'archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 100),
  role public.app_role not null default 'editor',
  active boolean not null default true,
  notify_on_publish boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 160),
  summary text not null default '',
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  status public.content_status not null default 'draft',
  navigation_position integer,
  parent_id uuid references public.pages(id) on delete set null,
  created_by uuid not null references public.profiles(id),
  updated_by uuid not null references public.profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.page_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  title text not null,
  summary text not null,
  content jsonb not null,
  status public.content_status not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  excerpt text not null check (char_length(excerpt) between 1 and 500),
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  starts_at timestamptz not null,
  ends_at timestamptz,
  featured boolean not null default false,
  status public.content_status not null default 'draft',
  created_by uuid not null references public.profiles(id),
  updated_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles as p
  where p.id = auth.uid()
    and p.active
$$;

create function public.is_active_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.current_app_role() in ('admin'::public.app_role, 'editor'::public.app_role),
    false
  )
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() = 'admin'::public.app_role, false)
$$;

create function public.publish_page(page_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  page_record public.pages%rowtype;
begin
  if not public.is_active_editor() then
    raise exception 'An active editor is required to publish pages'
      using errcode = '42501';
  end if;

  select p.*
  into page_record
  from public.pages as p
  where p.id = $1
  for update;

  if not found then
    raise exception 'Page % does not exist', $1
      using errcode = 'P0002';
  end if;

  insert into public.page_revisions (
    page_id,
    title,
    summary,
    content,
    status,
    created_by
  )
  values (
    page_record.id,
    page_record.title,
    page_record.summary,
    page_record.content,
    'published',
    actor_id
  );

  update public.pages as p
  set
    status = 'published',
    published_at = now(),
    updated_by = actor_id,
    updated_at = now()
  where p.id = page_record.id;

  insert into public.audit_log (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    actor_id,
    'page.publish',
    'page',
    page_record.id,
    '{}'::jsonb
  );
end;
$$;

create function public.restore_page_revision(revision_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  revision_record public.page_revisions%rowtype;
  page_record public.pages%rowtype;
begin
  if not public.is_admin() then
    raise exception 'An administrator is required to restore page revisions'
      using errcode = '42501';
  end if;

  select r.*
  into revision_record
  from public.page_revisions as r
  where r.id = $1;

  if not found then
    raise exception 'Page revision % does not exist', $1
      using errcode = 'P0002';
  end if;

  select p.*
  into page_record
  from public.pages as p
  where p.id = revision_record.page_id
  for update;

  if not found then
    raise exception 'Page % does not exist', revision_record.page_id
      using errcode = 'P0002';
  end if;

  update public.pages as p
  set
    title = revision_record.title,
    summary = revision_record.summary,
    content = revision_record.content,
    status = revision_record.status,
    updated_by = actor_id,
    updated_at = now(),
    published_at = case
      when revision_record.status = 'published' then now()
      else null
    end
  where p.id = page_record.id
  returning p.* into page_record;

  insert into public.page_revisions (
    page_id,
    title,
    summary,
    content,
    status,
    created_by
  )
  values (
    page_record.id,
    page_record.title,
    page_record.summary,
    page_record.content,
    page_record.status,
    actor_id
  );

  insert into public.audit_log (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    actor_id,
    'page.restore',
    'page',
    page_record.id,
    jsonb_build_object('revision_id', revision_record.id)
  );
end;
$$;

alter table public.profiles enable row level security;
alter table public.pages enable row level security;
alter table public.page_revisions enable row level security;
alter table public.news enable row level security;
alter table public.audit_log enable row level security;

create policy profiles_read_self
on public.profiles
for select
to authenticated
using (id = auth.uid() and active);

create policy profiles_admin_all
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy pages_public_read
on public.pages
for select
to anon, authenticated
using (status = 'published');

create policy pages_editor_write
on public.pages
for all
to authenticated
using (public.is_active_editor())
with check (public.is_active_editor());

create policy news_public_read
on public.news
for select
to anon, authenticated
using (status = 'published');

create policy news_editor_write
on public.news
for all
to authenticated
using (public.is_active_editor())
with check (public.is_active_editor());

grant usage on type public.app_role, public.content_status to anon, authenticated, service_role;
grant select on public.pages, public.news to anon;
grant select, insert, update, delete on public.profiles, public.pages, public.news
  to authenticated;

revoke all on function public.current_app_role() from public;
revoke all on function public.is_active_editor() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.publish_page(uuid) from public;
revoke all on function public.restore_page_revision(uuid) from public;

grant execute on function public.current_app_role() to authenticated, service_role;
grant execute on function public.is_active_editor() to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.publish_page(uuid) to authenticated, service_role;
grant execute on function public.restore_page_revision(uuid) to authenticated, service_role;
