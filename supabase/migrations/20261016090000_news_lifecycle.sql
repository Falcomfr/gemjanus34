create table private.news_lifecycle_context (
  transaction_id bigint not null,
  actor_id uuid not null,
  news_id uuid not null,
  target_status public.content_status not null,
  primary key (transaction_id, actor_id, news_id)
);

revoke all on table private.news_lifecycle_context from public, anon, authenticated;

create or replace function public.enforce_news_write_boundaries()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_actor_id uuid := auth.uid();
  lifecycle_allowed boolean := false;
begin
  if not public.is_valid_rich_content(new.content) then
    raise exception 'content must be valid Tiptap JSON'
      using errcode = '23514';
  end if;

  if current_actor_id is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.created_by <> current_actor_id then
      raise exception 'created_by must match the authenticated user'
        using errcode = '42501';
    end if;
    if new.updated_by <> current_actor_id then
      raise exception 'updated_by must match the authenticated user'
        using errcode = '42501';
    end if;
    if new.status <> 'draft' then
      raise exception 'News must be published through the publication RPC'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'id cannot be changed'
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

  select exists (
    select 1
    from private.news_lifecycle_context as context
    where context.transaction_id = pg_catalog.txid_current()
      and context.actor_id = current_actor_id
      and context.news_id = old.id
      and context.target_status = new.status
  ) into lifecycle_allowed;

  if new.status is distinct from old.status and not lifecycle_allowed then
    if new.status = 'published' and old.status = 'archived' then
      raise exception 'News must be restored through the restoration RPC'
        using errcode = '42501';
    elsif new.status = 'published' then
      raise exception 'News must be published through the publication RPC'
        using errcode = '42501';
    else
      raise exception 'News must be archived through the archival RPC'
        using errcode = '42501';
    end if;
  end if;

  if old.status <> 'draft' and not lifecycle_allowed then
    raise exception 'Only draft news can be edited directly'
      using errcode = '42501';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create function public.publish_news(news_id uuid)
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
    raise exception 'An active editor is required to publish news'
      using errcode = '42501';
  end if;

  select n.* into news_record
  from public.news as n
  where n.id = $1
  for update;

  if not found then
    raise exception 'News % does not exist', $1 using errcode = 'P0002';
  end if;
  if news_record.status <> 'draft' then
    raise exception 'Only draft news can be published' using errcode = '42501';
  end if;

  insert into private.news_lifecycle_context (transaction_id, actor_id, news_id, target_status)
  values (pg_catalog.txid_current(), current_actor_id, news_record.id, 'published');

  update public.news
  set status = 'published', updated_by = current_actor_id
  where id = news_record.id;

  insert into public.audit_log (actor_id, action, entity_type, entity_id)
  values (current_actor_id, 'news.publish', 'news', news_record.id);

  delete from private.news_lifecycle_context
  where transaction_id = pg_catalog.txid_current()
    and news_lifecycle_context.actor_id = current_actor_id;
end;
$$;

create function public.archive_news(news_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_actor_id uuid := auth.uid();
  news_record public.news%rowtype;
begin
  if not public.is_admin() then
    raise exception 'An administrator is required to archive news'
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

create function public.restore_news(news_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_actor_id uuid := auth.uid();
  news_record public.news%rowtype;
begin
  if not public.is_admin() then
    raise exception 'An administrator is required to restore news'
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

revoke all on function public.publish_news(uuid) from public, anon;
revoke all on function public.archive_news(uuid) from public, anon;
revoke all on function public.restore_news(uuid) from public, anon;
grant execute on function public.publish_news(uuid) to authenticated, service_role;
grant execute on function public.archive_news(uuid) to authenticated, service_role;
grant execute on function public.restore_news(uuid) to authenticated, service_role;
