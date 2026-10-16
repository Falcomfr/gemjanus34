-- Visitors may only send the four form fields: dates and handling stay server-side.
revoke insert on public.contact_messages from anon, authenticated;
grant insert (name, email, subject, message) on public.contact_messages to anon, authenticated;

-- One plain address: no spaces, no query characters that could ride on a mailto: link.
alter table public.contact_messages
  add constraint contact_messages_email_format
  check (email ~ '^[^@\s?&#,;]+@[^@\s?&#,;]+\.[^@\s?&#,;]+$');
