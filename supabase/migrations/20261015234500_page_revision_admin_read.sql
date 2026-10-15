create policy page_revisions_admin_read
on public.page_revisions
for select
to authenticated
using (public.is_admin());

grant select on public.page_revisions to authenticated;
