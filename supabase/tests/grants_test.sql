begin;
select plan(12);

-- Visitors read public content only.
select ok(has_table_privilege('anon', 'public.documents', 'SELECT'), 'visitors read documents');
select ok(not has_table_privilege('anon', 'public.documents', 'INSERT'), 'visitors cannot add documents');
select ok(has_table_privilege('anon', 'public.planning_slots', 'SELECT'), 'visitors read the planning');
select ok(has_table_privilege('anon', 'public.planning_days', 'SELECT'), 'visitors read the opening days');
select ok(has_table_privilege('anon', 'public.planning_settings', 'SELECT'), 'visitors read the planning settings');
select ok(not has_table_privilege('anon', 'public.planning_slots', 'UPDATE'), 'visitors cannot change the planning');
select ok(not has_table_privilege('anon', 'public.contact_messages', 'SELECT'), 'visitors cannot read messages');
select ok(has_column_privilege('anon', 'public.contact_messages', 'message', 'INSERT'), 'visitors can send a message');
select ok(not has_table_privilege('anon', 'public.contact_messages', 'TRUNCATE'), 'visitors cannot truncate messages');

-- Signed-in team members get what the admin needs; RLS still checks the active profile.
select ok(has_table_privilege('authenticated', 'public.contact_messages', 'DELETE'), 'the team deletes messages');
select ok(has_table_privilege('authenticated', 'public.planning_slots', 'INSERT'), 'the team adds slots');
select ok(has_table_privilege('authenticated', 'public.documents', 'DELETE'), 'the team deletes documents');

select * from finish();
rollback;
