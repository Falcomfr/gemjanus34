-- Conferences of the yearly cycle and their registrations, each behind a switch of its own.
alter table public.site_settings
  add column conferences_enabled boolean not null default false,
  add column registrations_enabled boolean not null default false;
grant update (conferences_enabled, registrations_enabled) on public.site_settings to authenticated;

create table public.conferences (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  speaker text check (speaker is null or char_length(speaker) between 1 and 120),
  starts_at timestamptz not null,
  place text not null check (char_length(place) between 1 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  capacity integer check (capacity is null or capacity between 1 and 1000),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.conference_registrations (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  contact text not null check (char_length(contact) between 5 and 254),
  seats integer not null default 1 check (seats between 1 and 4),
  created_at timestamptz not null default now()
);

create index conference_registrations_conference_id on public.conference_registrations (conference_id);

alter table public.conferences enable row level security;
alter table public.conference_registrations enable row level security;

-- Visitors cannot call is_active_editor(), hence a policy of their own.
create policy conferences_public_read on public.conferences for select to anon
  using ((select s.conferences_enabled from public.site_settings as s));
create policy conferences_team_read on public.conferences for select to authenticated
  using ((select s.conferences_enabled from public.site_settings as s) or public.is_active_editor());
create policy conferences_team_insert on public.conferences for insert to authenticated
  with check (public.is_active_editor() and created_by = auth.uid());
create policy conferences_team_delete on public.conferences for delete to authenticated
  using (public.is_active_editor());

create policy registrations_team_read on public.conference_registrations for select to authenticated
  using (public.is_active_editor());
create policy registrations_team_delete on public.conference_registrations for delete to authenticated
  using (public.is_active_editor());

revoke all on public.conferences, public.conference_registrations from anon, authenticated;
grant select on public.conferences to anon, authenticated;
grant insert (title, speaker, starts_at, place, description, capacity, created_by), delete on public.conferences to authenticated;
grant select, delete on public.conference_registrations to authenticated;

-- The only way in for a registration: checks the switches, the date and the seats left,
-- with the conference row locked so that two registrations at once cannot overbook it.
create function public.register_for_conference(conference_id uuid, name text, contact text, seats integer)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  conference public.conferences%rowtype;
  taken bigint;
begin
  if not (select s.conferences_enabled and s.registrations_enabled from public.site_settings as s) then
    return 'closed';
  end if;

  select c.* into conference from public.conferences as c where c.id = $1 for update;
  if not found then
    return 'closed';
  end if;
  if conference.starts_at < now() then
    return 'past';
  end if;
  if char_length(trim($2)) not between 2 and 100 or char_length(trim($3)) not between 5 and 254 or $4 not between 1 and 4 then
    return 'invalid';
  end if;

  if conference.capacity is not null then
    select coalesce(sum(r.seats), 0) into taken from public.conference_registrations as r where r.conference_id = $1;
    if taken + $4 > conference.capacity then
      return 'full';
    end if;
  end if;

  insert into public.conference_registrations (conference_id, name, contact, seats)
  values ($1, trim($2), trim($3), $4);
  return 'ok';
end;
$$;

-- Seats taken per conference, without saying who took them; nothing while the page is off.
create function public.conference_seats_taken()
returns table (conference_id uuid, seats bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select r.conference_id, sum(r.seats)::bigint
  from public.conference_registrations as r
  where (select s.conferences_enabled from public.site_settings as s)
  group by r.conference_id
$$;

revoke all on function public.register_for_conference(uuid, text, text, integer) from public;
revoke all on function public.conference_seats_taken() from public;
grant execute on function public.register_for_conference(uuid, text, text, integer) to anon, authenticated, service_role;
grant execute on function public.conference_seats_taken() to anon, authenticated, service_role;
