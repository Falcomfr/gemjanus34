create extension if not exists pgcrypto;
create extension if not exists pg_jsonschema with schema extensions;

create type public.app_role as enum ('admin', 'editor');
create type public.content_status as enum ('draft', 'published', 'archived');

create schema private;
revoke all on schema private from public, anon, authenticated;

create table private.page_publication_context (
  transaction_id bigint not null,
  actor_id uuid not null,
  primary key (transaction_id, actor_id)
);

revoke all on table private.page_publication_context from public, anon, authenticated;

create function public.is_valid_rich_content(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select extensions.jsonb_matches_schema(
    $schema$
      {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$ref": "#/definitions/doc",
        "definitions": {
          "doc": {
            "type": "object",
            "required": ["type", "content"],
            "properties": {
              "type": { "const": "doc" },
              "content": {
                "type": "array",
                "items": { "$ref": "#/definitions/block" }
              }
            },
            "additionalProperties": false
          },
          "block": {
            "oneOf": [
              { "$ref": "#/definitions/paragraph" },
              { "$ref": "#/definitions/heading" },
              { "$ref": "#/definitions/bulletList" },
              { "$ref": "#/definitions/orderedList" }
            ]
          },
          "paragraph": {
            "type": "object",
            "required": ["type"],
            "properties": {
              "type": { "const": "paragraph" },
              "content": {
                "type": "array",
                "items": { "$ref": "#/definitions/inline" }
              }
            },
            "additionalProperties": false
          },
          "heading": {
            "type": "object",
            "required": ["type", "attrs"],
            "properties": {
              "type": { "const": "heading" },
              "attrs": {
                "type": "object",
                "required": ["level"],
                "properties": { "level": { "enum": [2, 3] } },
                "additionalProperties": false
              },
              "content": {
                "type": "array",
                "items": { "$ref": "#/definitions/inline" }
              }
            },
            "additionalProperties": false
          },
          "bulletList": {
            "type": "object",
            "required": ["type", "content"],
            "properties": {
              "type": { "const": "bulletList" },
              "content": {
                "type": "array",
                "minItems": 1,
                "items": { "$ref": "#/definitions/listItem" }
              }
            },
            "additionalProperties": false
          },
          "orderedList": {
            "type": "object",
            "required": ["type", "content"],
            "properties": {
              "type": { "const": "orderedList" },
              "attrs": {
                "type": "object",
                "properties": { "start": { "type": "integer", "minimum": 1 } },
                "additionalProperties": false
              },
              "content": {
                "type": "array",
                "minItems": 1,
                "items": { "$ref": "#/definitions/listItem" }
              }
            },
            "additionalProperties": false
          },
          "listItem": {
            "type": "object",
            "required": ["type", "content"],
            "properties": {
              "type": { "const": "listItem" },
              "content": {
                "type": "array",
                "minItems": 1,
                "items": {
                  "oneOf": [
                    { "$ref": "#/definitions/paragraph" },
                    { "$ref": "#/definitions/heading" },
                    { "$ref": "#/definitions/bulletList" },
                    { "$ref": "#/definitions/orderedList" }
                  ]
                }
              }
            },
            "additionalProperties": false
          },
          "inline": {
            "oneOf": [
              { "$ref": "#/definitions/text" },
              { "$ref": "#/definitions/hardBreak" }
            ]
          },
          "text": {
            "type": "object",
            "required": ["type", "text"],
            "properties": {
              "type": { "const": "text" },
              "text": { "type": "string" },
              "marks": {
                "type": "array",
                "items": { "$ref": "#/definitions/mark" }
              }
            },
            "additionalProperties": false
          },
          "hardBreak": {
            "type": "object",
            "required": ["type"],
            "properties": { "type": { "const": "hardBreak" } },
            "additionalProperties": false
          },
          "mark": {
            "oneOf": [
              {
                "type": "object",
                "required": ["type"],
                "properties": { "type": { "enum": ["bold", "italic", "underline"] } },
                "additionalProperties": false
              },
              {
                "type": "object",
                "required": ["type", "attrs"],
                "properties": {
                  "type": { "const": "link" },
                  "attrs": {
                    "type": "object",
                    "required": ["href"],
                    "properties": {
                      "href": {
                        "type": "string",
                        "minLength": 1,
                        "pattern": "^(?![\\x00-\\x20]*[jJ][aA][vV][aA][sS][cC][rR][iI][pP][tT]:)"
                      },
                      "target": { "type": ["string", "null"] },
                      "rel": { "type": ["string", "null"] },
                      "class": { "type": ["string", "null"] }
                    },
                    "additionalProperties": false
                  }
                },
                "additionalProperties": false
              },
              {
                "type": "object",
                "required": ["type", "attrs"],
                "properties": {
                  "type": { "const": "textStyle" },
                  "attrs": {
                    "type": "object",
                    "required": ["color"],
                    "properties": {
                      "color": {
                        "enum": ["#202521", "#185c4c", "#c84f3b", "#5b655f"]
                      }
                    },
                    "additionalProperties": false
                  }
                },
                "additionalProperties": false
              }
            ]
          }
        }
      }
    $schema$::json,
    value
  )
$$;

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
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb
    check (public.is_valid_rich_content(content)),
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
  content jsonb not null check (public.is_valid_rich_content(content)),
  status public.content_status not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  excerpt text not null check (char_length(excerpt) between 1 and 500),
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb
    check (public.is_valid_rich_content(content)),
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

create function public.enforce_page_write_boundaries()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_actor_id uuid := auth.uid();
  actor_is_admin boolean;
  publication_allowed boolean;
begin
  if not public.is_valid_rich_content(new.content) then
    raise exception 'content must be valid Tiptap JSON'
      using errcode = '23514';
  end if;

  if current_actor_id is null then
    return new;
  end if;

  actor_is_admin := public.is_admin();
  select exists (
    select 1
    from private.page_publication_context as context
    where context.transaction_id = pg_catalog.txid_current()
      and context.actor_id = current_actor_id
  ) into publication_allowed;

  if tg_op = 'INSERT' then
    if new.created_by <> current_actor_id then
      raise exception 'created_by must match the authenticated user'
        using errcode = '42501';
    end if;

    if new.updated_by <> current_actor_id then
      raise exception 'updated_by must match the authenticated user'
        using errcode = '42501';
    end if;

    if new.status <> 'draft' or new.published_at is not null then
      raise exception 'Pages must be published through the publication RPC'
        using errcode = '42501';
    end if;

    if not actor_is_admin
      and (new.navigation_position is not null or new.parent_id is not null)
    then
      raise exception 'An administrator is required to manage page structure'
        using errcode = '42501';
    end if;

    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'id cannot be changed'
      using errcode = '42501';
  end if;

  if not actor_is_admin and old.status <> 'draft' then
    raise exception 'An administrator is required to change a non-draft page'
      using errcode = '42501';
  end if;

  if new.created_by is distinct from old.created_by then
    raise exception 'created_by cannot be changed'
      using errcode = '42501';
  end if;

  if new.updated_by <> current_actor_id then
    raise exception 'updated_by must match the authenticated user'
      using errcode = '42501';
  end if;

  if not actor_is_admin and (
    new.slug is distinct from old.slug
    or new.navigation_position is distinct from old.navigation_position
    or new.parent_id is distinct from old.parent_id
  ) then
    raise exception 'An administrator is required to manage page structure'
      using errcode = '42501';
  end if;

  if new.status is distinct from old.status then
    if new.status = 'published' and not publication_allowed then
      raise exception 'Pages must be published through the publication RPC'
        using errcode = '42501';
    end if;

    if not actor_is_admin then
      raise exception 'An administrator is required to change page status'
        using errcode = '42501';
    end if;
  end if;

  if new.published_at is distinct from old.published_at and not publication_allowed then
    raise exception 'Pages must be published through the publication RPC'
      using errcode = '42501';
  end if;

  if old.status = 'published'
    and new.status = 'published'
    and (
      new.title is distinct from old.title
      or new.summary is distinct from old.summary
      or new.content is distinct from old.content
    )
    and not publication_allowed
  then
    raise exception 'Published page content must use the publication workflow'
      using errcode = '42501';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create function public.enforce_news_write_boundaries()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_is_admin boolean;
begin
  if not public.is_valid_rich_content(new.content) then
    raise exception 'content must be valid Tiptap JSON'
      using errcode = '23514';
  end if;

  if actor_id is null then
    return new;
  end if;

  actor_is_admin := public.is_admin();

  if tg_op = 'INSERT' then
    if new.created_by <> actor_id then
      raise exception 'created_by must match the authenticated user'
        using errcode = '42501';
    end if;

    if new.updated_by <> actor_id then
      raise exception 'updated_by must match the authenticated user'
        using errcode = '42501';
    end if;

    if new.status <> 'draft' and not actor_is_admin then
      raise exception 'An administrator is required to publish or archive news'
        using errcode = '42501';
    end if;

    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'id cannot be changed'
      using errcode = '42501';
  end if;

  if not actor_is_admin and old.status <> 'draft' then
    raise exception 'An administrator is required to change non-draft news'
      using errcode = '42501';
  end if;

  if new.created_by is distinct from old.created_by then
    raise exception 'created_by cannot be changed'
      using errcode = '42501';
  end if;

  if new.updated_by <> actor_id then
    raise exception 'updated_by must match the authenticated user'
      using errcode = '42501';
  end if;

  if new.status is distinct from old.status
    and not actor_is_admin
  then
    raise exception 'An administrator is required to publish or archive news'
      using errcode = '42501';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger pages_enforce_write_boundaries
before insert or update on public.pages
for each row execute function public.enforce_page_write_boundaries();

create trigger news_enforce_write_boundaries
before insert or update on public.news
for each row execute function public.enforce_news_write_boundaries();

create function public.publish_page(page_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_actor_id uuid := auth.uid();
  page_record public.pages%rowtype;
begin
  if not public.is_admin() then
    raise exception 'An administrator is required to publish pages'
      using errcode = '42501';
  end if;

  insert into private.page_publication_context (transaction_id, actor_id)
  values (pg_catalog.txid_current(), current_actor_id);

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
    current_actor_id
  );

  update public.pages as p
  set
    status = 'published',
    published_at = now(),
    updated_by = current_actor_id,
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
    current_actor_id,
    'page.publish',
    'page',
    page_record.id,
    '{}'::jsonb
  );

  delete from private.page_publication_context as context
  where context.transaction_id = pg_catalog.txid_current()
    and context.actor_id = current_actor_id;
end;
$$;

create function public.restore_page_revision(revision_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_actor_id uuid := auth.uid();
  revision_record public.page_revisions%rowtype;
  page_record public.pages%rowtype;
begin
  if not public.is_admin() then
    raise exception 'An administrator is required to restore page revisions'
      using errcode = '42501';
  end if;

  insert into private.page_publication_context (transaction_id, actor_id)
  values (pg_catalog.txid_current(), current_actor_id);

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
    updated_by = current_actor_id,
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
    current_actor_id
  );

  insert into public.audit_log (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    current_actor_id,
    'page.restore',
    'page',
    page_record.id,
    jsonb_build_object('revision_id', revision_record.id)
  );

  delete from private.page_publication_context as context
  where context.transaction_id = pg_catalog.txid_current()
    and context.actor_id = current_actor_id;
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
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update on public.pages, public.news to authenticated;
revoke delete on public.pages, public.news from anon, authenticated;

revoke all on function public.is_valid_rich_content(jsonb) from public, anon;
revoke all on function public.current_app_role() from public, anon;
revoke all on function public.is_active_editor() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.enforce_page_write_boundaries() from public, anon;
revoke all on function public.enforce_news_write_boundaries() from public, anon;
revoke all on function public.publish_page(uuid) from public, anon;
revoke all on function public.restore_page_revision(uuid) from public, anon;

grant execute on function public.is_valid_rich_content(jsonb) to authenticated, service_role;
grant execute on function public.current_app_role() to authenticated, service_role;
grant execute on function public.is_active_editor() to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.publish_page(uuid) to authenticated, service_role;
grant execute on function public.restore_page_revision(uuid) to authenticated, service_role;
