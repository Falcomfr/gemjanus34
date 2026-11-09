-- Third role between editor and admin; used by the next migration (a new enum value cannot be used in its own transaction).
alter type public.app_role add value if not exists 'manager';
