-- Stripe go-live prep — run ONLY when Stripe keys arrive (before flipping envs).

alter table public.payments add column stripe_payment_intent_id text;
alter table public.payments add column stripe_session_id text;
create index idx_payments_stripe_pi on public.payments(stripe_payment_intent_id);

alter type payment_status add value if not exists 'authorized';
alter type payment_status add value if not exists 'cancelled';

-- Vercel cron (/api/cron/expire) takes over expiry and also releases card holds:
select cron.unschedule('expire-stale-booking-requests');
