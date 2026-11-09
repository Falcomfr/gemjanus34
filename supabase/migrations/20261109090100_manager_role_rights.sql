-- Managers change the content of what exists; structure, accounts and first publication stay with administrators.

create function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_app_role() in ('admin'::public.app_role, 'manager'::public.app_role), false)
$$;

create or replace function public.is_active_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.current_app_role() in ('admin'::public.app_role, 'manager'::public.app_role, 'editor'::public.app_role),
    false
  )
$$;
create or replace function public.enforce_page_write_boundaries()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_actor_id uuid := auth.uid();
  actor_is_admin boolean;
  actor_is_manager boolean;
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
  actor_is_manager := public.is_manager();
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

  if not actor_is_manager and old.status <> 'draft' then
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

    if not actor_is_admin and not (actor_is_manager and new.status = 'published' and publication_allowed) then
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
create or replace function public.publish_page(page_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_actor_id uuid := auth.uid();
  page_record public.pages%rowtype;
begin
  if not public.is_manager() then
    raise exception 'An administrator or manager is required to publish pages'
      using errcode = '42501';
  end if;

  -- A page never published before is a new page on the site: that is structure.
  if not public.is_admin() and not exists (
    select 1 from public.page_revisions as r where r.page_id = $1 and r.status = 'published'
  ) then
    raise exception 'An administrator is required to put a new page online'
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
create or replace function public.restore_page_revision(revision_id uuid)
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
  if not public.is_manager() then
    raise exception 'An administrator or manager is required to restore page revisions'
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
create or replace function public.update_published_page(
  page_id uuid,
  new_title text,
  new_summary text,
  new_content jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_actor_id uuid := auth.uid();
  page_record public.pages%rowtype;
begin
  if not public.is_manager() then
    raise exception 'An administrator or manager is required to edit published pages'
      using errcode = '42501';
  end if;

  select p.* into page_record
  from public.pages as p
  where p.id = $1
  for update;

  if not found then
    raise exception 'Page % does not exist', $1 using errcode = 'P0002';
  end if;
  if page_record.status <> 'published' then
    raise exception 'Only published pages can be edited in place' using errcode = '42501';
  end if;

  insert into private.page_publication_context (transaction_id, actor_id)
  values (pg_catalog.txid_current(), current_actor_id);

  update public.pages as p
  set title = new_title, summary = new_summary, content = new_content, updated_by = current_actor_id
  where p.id = page_record.id;

  insert into public.page_revisions (page_id, title, summary, content, status, created_by)
  values (page_record.id, new_title, new_summary, new_content, 'published', current_actor_id);

  insert into public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (current_actor_id, 'page.update_published', 'page', page_record.id, '{}'::jsonb);

  delete from private.page_publication_context as context
  where context.transaction_id = pg_catalog.txid_current()
    and context.actor_id = current_actor_id;
end;
$$;
create or replace function public.archive_news(news_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_actor_id uuid := auth.uid();
  news_record public.news%rowtype;
begin
  if not public.is_manager() then
    raise exception 'An administrator or manager is required to archive news'
      using errcode = '42501';
  end if;

  select n.* into news_record from public.news as n where n.id = $1 for update;
  if not found then
    raise exception 'News % does not exist', $1 using errcode = 'P0002';
  end if;
  if news_record.status <> 'published' then
    raise exception 'Only published news can be archived' using errcode = '42501';
  end if;

  insert into private.news_lifecycle_context (transaction_id, actor_id, news_id, target_status)
  values (pg_catalog.txid_current(), current_actor_id, news_record.id, 'archived');

  update public.news set status = 'archived', updated_by = current_actor_id where id = news_record.id;
  insert into public.audit_log (actor_id, action, entity_type, entity_id)
  values (current_actor_id, 'news.archive', 'news', news_record.id);

  delete from private.news_lifecycle_context
  where transaction_id = pg_catalog.txid_current()
    and news_lifecycle_context.actor_id = current_actor_id;
end;
$$;
create or replace function public.restore_news(news_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_actor_id uuid := auth.uid();
  news_record public.news%rowtype;
begin
  if not public.is_manager() then
    raise exception 'An administrator or manager is required to restore news'
      using errcode = '42501';
  end if;

  select n.* into news_record from public.news as n where n.id = $1 for update;
  if not found then
    raise exception 'News % does not exist', $1 using errcode = 'P0002';
  end if;
  if news_record.status <> 'archived' then
    raise exception 'Only archived news can be restored' using errcode = '42501';
  end if;

  insert into private.news_lifecycle_context (transaction_id, actor_id, news_id, target_status)
  values (pg_catalog.txid_current(), current_actor_id, news_record.id, 'published');

  update public.news set status = 'published', updated_by = current_actor_id where id = news_record.id;
  insert into public.audit_log (actor_id, action, entity_type, entity_id)
  values (current_actor_id, 'news.restore', 'news', news_record.id);

  delete from private.news_lifecycle_context
  where transaction_id = pg_catalog.txid_current()
    and news_lifecycle_context.actor_id = current_actor_id;
end;
$$;
drop policy page_revisions_admin_read on public.page_revisions;
create policy page_revisions_manager_read
on public.page_revisions
for select
to authenticated
using (public.is_manager());

revoke all on function public.is_manager() from public, anon;
grant execute on function public.is_manager() to authenticated, service_role;
