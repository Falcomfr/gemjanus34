-- Administrators and managers delete an archived news item for good.
-- Restrictive, so the permissive news_editor_write policy cannot open deletion to editors.
create policy news_manager_delete_archived
on public.news
as restrictive
for delete
to authenticated
using (public.is_manager() and status = 'archived');

grant delete on public.news to authenticated;
