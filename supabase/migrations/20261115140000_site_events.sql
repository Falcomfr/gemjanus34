-- Daily totals of a few visitor gestures (call, map, PDF, HelloAsso): no row per visitor, no IP, no cookie.
create table public.site_events (
  day date not null,
  event text not null check (event in ('phone', 'map', 'pdf', 'helloasso')),
  count integer not null default 0 check (count >= 0),
  primary key (day, event)
);

alter table public.site_events enable row level security;
create policy site_events_admin_read on public.site_events for select to authenticated using (public.is_admin());
revoke all on public.site_events from anon, authenticated;
grant select on public.site_events to authenticated;

create function public.count_site_event(p_event text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_event is null or p_event not in ('phone', 'map', 'pdf', 'helloasso') then
    raise exception 'unknown site event' using errcode = '22023';
  end if;
  insert into public.site_events (day, event, count)
  values ((now() at time zone 'Europe/Paris')::date, p_event, 1)
  on conflict (day, event) do update set count = public.site_events.count + 1;
end;
$$;

revoke all on function public.count_site_event(text) from public;
grant execute on function public.count_site_event(text) to anon, authenticated;

-- The statistics page shows who of the team published what: administrators only.
create policy audit_log_admin_read on public.audit_log for select to authenticated using (public.is_admin());
grant select on public.audit_log to authenticated;

-- Privacy page: say what the counters are, only where the sentence still reads as written by the site.
update public.pages
set content = replace(
    content::text,
    'Il compte les visites avec Cloudflare Web Analytics, un outil sans cookie qui n''enregistre rien sur votre appareil.',
    'Il compte les visites avec Cloudflare Web Analytics, un outil sans cookie qui n''enregistre rien sur votre appareil. Il compte aussi, jour par jour, le nombre total de clics sur quelques boutons (appeler, carte, documents PDF, adhésion) : ces totaux ne disent pas qui a cliqué et ne contiennent aucune donnée sur vous.'
  )::jsonb,
  updated_at = now()
where slug = 'confidentialite'
  and content::text like '%Il compte les visites avec Cloudflare Web Analytics, un outil sans cookie qui n''enregistre rien sur votre appareil.%';
