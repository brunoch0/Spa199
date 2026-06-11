-- Approval gate: new therapists must be approved by admin before appearing in search.
-- Run in Supabase SQL Editor (or via MCP when it recovers).

alter table public.therapists alter column is_approved set default false;

-- Existing seed therapists stay approved; any not-yet-reviewed real signups get unlisted:
-- (uncomment if you want to force re-review of real signups created before this change)
-- update public.therapists set is_approved = false
--   where id in (select id from public.profiles where auth_id is not null and role = 'therapist');
