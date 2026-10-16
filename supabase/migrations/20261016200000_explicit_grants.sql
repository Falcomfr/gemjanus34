-- Hosted Supabase projects do not grant new tables to the API roles, while the local stack
-- grants everything. State the privileges explicitly (as admin_core does); RLS still applies.
revoke all on public.documents, public.contact_messages, public.planning_settings, public.planning_days, public.planning_slots
  from anon, authenticated;

grant select on public.documents, public.planning_settings, public.planning_days, public.planning_slots to anon, authenticated;

grant insert, delete on public.documents to authenticated;

grant insert (name, email, subject, message) on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;

grant update on public.planning_settings, public.planning_days to authenticated;
grant insert, update, delete on public.planning_slots to authenticated;
