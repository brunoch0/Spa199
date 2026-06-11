-- Session reminders via pg_cron (hourly) — 24h and 2h before confirmed sessions,
-- to both guest and therapist. Dubai time (GST). Run in SQL Editor.

select cron.schedule('booking-session-reminders', '0 * * * *', $cron$
with upcoming as (
  select b.*,
    extract(epoch from ((b.booking_date + b.start_time) - (now() at time zone 'Asia/Dubai')))/3600 as hrs
  from public.bookings b
  where b.status = 'confirmed'
    and b.booking_date between current_date and current_date + 2
),
targets as (
  select customer_id as pid, '/bookings/' || id as link,
         'Session tomorrow 🌿' as title,
         'Your ' || replace(service_type, '_', ' ') || ' session is tomorrow — '
           || booking_date || ' ' || to_char(start_time, 'HH24:MI') || '.' as body
  from upcoming where hrs > 22 and hrs <= 25
  union all
  select therapist_id, '/therapist/bookings', 'Session tomorrow 🌿',
         'Session tomorrow: ' || booking_date || ' ' || to_char(start_time, 'HH24:MI')
           || ' · ' || coalesce(area, address_text)
  from upcoming where hrs > 22 and hrs <= 25
  union all
  select customer_id, '/bookings/' || id, 'Session starting soon',
         'Your ' || replace(service_type, '_', ' ') || ' session starts soon — today '
           || to_char(start_time, 'HH24:MI') || '.'
  from upcoming where hrs > 1 and hrs <= 3
  union all
  select therapist_id, '/therapist/bookings', 'Session starting soon',
         'Session soon: today ' || to_char(start_time, 'HH24:MI')
           || ' · ' || coalesce(area, address_text)
  from upcoming where hrs > 1 and hrs <= 3
)
insert into public.notifications (profile_id, title, body, link)
select pid, title, body, link
from targets t
where not exists (
  select 1 from public.notifications n
  where n.profile_id = t.pid and n.title = t.title and n.link = t.link
    and n.created_at > now() - interval '26 hours'
);
$cron$);
