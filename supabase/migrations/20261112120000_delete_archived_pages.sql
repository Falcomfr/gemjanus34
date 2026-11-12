-- Administrators delete an archived page for good, with its revisions (on delete cascade).
-- A page that is still a parent stays: its sub-pages would otherwise move up to the main menu.
-- Restrictive, so the permissive pages_editor_write policy cannot open deletion to editors.
create policy pages_admin_delete_archived
on public.pages
as restrictive
for delete
to authenticated
using (
  public.is_admin()
  and status = 'archived'
  and not exists (select 1 from public.pages as child where child.parent_id = pages.id)
);

grant delete on public.pages to authenticated;
