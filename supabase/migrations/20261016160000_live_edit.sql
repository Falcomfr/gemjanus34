-- Correct published content in place, through the same audited publication path.

create function public.update_published_page(
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
  if not public.is_admin() then
    raise exception 'An administrator is required to edit published pages'
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

create function public.update_published_news(
  news_id uuid,
  new_title text,
  new_excerpt text,
  new_content jsonb,
  new_starts_at timestamptz,
  new_ends_at timestamptz,
  new_featured boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_actor_id uuid := auth.uid();
  news_record public.news%rowtype;
begin
  if not public.is_active_editor() then
    raise exception 'An active editor is required to edit published news'
      using errcode = '42501';
  end if;

  select n.* into news_record
  from public.news as n
  where n.id = $1
  for update;

  if not found then
    raise exception 'News % does not exist', $1 using errcode = 'P0002';
  end if;
  if news_record.status <> 'published' then
    raise exception 'Only published news can be edited in place' using errcode = '42501';
  end if;

  insert into private.news_lifecycle_context (transaction_id, actor_id, news_id, target_status)
  values (pg_catalog.txid_current(), current_actor_id, news_record.id, 'published');

  update public.news
  set
    title = new_title,
    excerpt = new_excerpt,
    content = new_content,
    starts_at = new_starts_at,
    ends_at = new_ends_at,
    featured = new_featured,
    updated_by = current_actor_id
  where id = news_record.id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id)
  values (current_actor_id, 'news.update_published', 'news', news_record.id);

  delete from private.news_lifecycle_context
  where transaction_id = pg_catalog.txid_current()
    and news_lifecycle_context.actor_id = current_actor_id;
end;
$$;

revoke all on function public.update_published_page(uuid, text, text, jsonb) from public, anon;
revoke all on function public.update_published_news(uuid, text, text, jsonb, timestamptz, timestamptz, boolean) from public, anon;
grant execute on function public.update_published_page(uuid, text, text, jsonb) to authenticated;
grant execute on function public.update_published_news(uuid, text, text, jsonb, timestamptz, timestamptz, boolean) to authenticated;
