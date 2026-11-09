-- Colours of the site chosen in the settings; null keeps the original colours.
create function public.is_valid_theme(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(value) = 'object'
    and (select count(*) from jsonb_each(value)) = 5
    and (
      select bool_and(
        key in ('forest', 'coral', 'sun', 'background', 'text')
        and jsonb_typeof(item) = 'string'
        and item #>> '{}' ~ '^#[0-9a-fA-F]{6}$'
      )
      from jsonb_each(value) as entry(key, item)
    )
$$;

alter table public.site_settings
  add column theme jsonb check (theme is null or public.is_valid_theme(theme));

grant update (theme) on public.site_settings to authenticated;
grant execute on function public.is_valid_theme(jsonb) to anon, authenticated, service_role;
