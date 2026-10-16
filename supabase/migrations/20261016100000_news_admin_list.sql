create function public.list_news_with_authors()
returns table (
  id uuid,
  title text,
  status public.content_status,
  starts_at timestamptz,
  updated_at timestamptz,
  author_display_name text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_active_editor() then
    raise exception 'An active editor is required to list news authors'
      using errcode = '42501';
  end if;

  return query
  select
    news_row.id,
    news_row.title,
    news_row.status,
    news_row.starts_at,
    news_row.updated_at,
    author.display_name
  from public.news as news_row
  join public.profiles as author on author.id = news_row.created_by
  order by news_row.starts_at desc;
end;
$$;

revoke all on function public.list_news_with_authors() from public, anon, authenticated, service_role;
grant execute on function public.list_news_with_authors() to authenticated;
