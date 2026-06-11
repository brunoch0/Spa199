import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Server-only admin client (bypasses RLS) — used by webhooks, cron jobs and
// payment actions that must write rows the calling user can't (payments, notifications).
// Requires SUPABASE_SERVICE_ROLE_KEY (Dashboard → Settings → API → service_role).
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false },
  });
}
