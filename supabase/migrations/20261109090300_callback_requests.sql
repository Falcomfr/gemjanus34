-- "Call me back" requests share the messages inbox: a phone number instead of an e-mail and a subject.
alter table public.contact_messages
  add column kind text not null default 'message' check (kind in ('message', 'callback')),
  add column phone text,
  alter column email drop not null,
  alter column subject drop not null,
  drop constraint contact_messages_message_check,
  add constraint contact_messages_kind_fields check (
    (kind = 'message' and email is not null and subject is not null and phone is null
      and char_length(message) between 20 and 5000)
    or (kind = 'callback' and email is null and subject is null and phone ~ '^\+?[0-9][0-9 .]{8,18}[0-9]$'
      and char_length(message) <= 100)
  );

revoke insert on public.contact_messages from anon, authenticated;
grant insert (name, email, subject, message, kind, phone) on public.contact_messages to anon, authenticated;
