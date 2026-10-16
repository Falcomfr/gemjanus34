-- Messages sent from the public contact form; only the team can read them.
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) between 3 and 254),
  subject text not null check (char_length(subject) between 3 and 150),
  message text not null check (char_length(message) between 20 and 5000),
  created_at timestamptz not null default now(),
  handled_at timestamptz,
  handled_by uuid references public.profiles(id) on delete set null
);

alter table public.contact_messages enable row level security;

create policy contact_messages_public_insert
on public.contact_messages
for insert
to anon, authenticated
with check (handled_at is null and handled_by is null);

create policy contact_messages_editor_read
on public.contact_messages
for select
to authenticated
using (public.is_active_editor());

create policy contact_messages_editor_update
on public.contact_messages
for update
to authenticated
using (public.is_active_editor())
with check (public.is_active_editor());

create policy contact_messages_editor_delete
on public.contact_messages
for delete
to authenticated
using (public.is_active_editor());
