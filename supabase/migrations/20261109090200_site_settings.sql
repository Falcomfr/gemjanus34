-- Feature switches of the public site, one row; read by everyone, changed by administrators.
create table public.site_settings (
  id boolean primary key default true check (id),
  callback_enabled boolean not null default true,
  membership_enabled boolean not null default false,
  helloasso_url text check (helloasso_url is null or helloasso_url like 'https://www.helloasso.com/%'),
  updated_at timestamptz not null default now()
);

insert into public.site_settings default values;

alter table public.site_settings enable row level security;

create policy site_settings_public_read on public.site_settings for select to anon, authenticated using (true);
create policy site_settings_admin_update on public.site_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant update (callback_enabled, membership_enabled, helloasso_url, updated_at) on public.site_settings to authenticated;
