import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatAED } from "@/lib/constants";

export default async function TherapistDashboard() {
  const profile = (await getCurrentProfile())!;
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const [{ count: pendingCount }, { data: upcoming }, { data: completed }, { data: t }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("therapist_id", profile.id)
        .eq("status", "requested"),
      supabase
        .from("bookings")
        .select("*")
        .eq("therapist_id", profile.id)
        .eq("status", "confirmed")
        .gte("booking_date", today)
        .order("booking_date")
        .limit(5),
      supabase
        .from("bookings")
        .select("price_aed")
        .eq("therapist_id", profile.id)
        .eq("status", "completed"),
      supabase.from("therapists").select("rating_avg, rating_count").eq("id", profile.id).single(),
    ]);

  const totalEarnings = (completed ?? []).reduce((sum, b) => sum + Number(b.price_aed), 0);

  const stats = [
    { label: "Pending requests", value: String(pendingCount ?? 0), href: "/therapist/bookings" },
    { label: "Upcoming sessions", value: String(upcoming?.length ?? 0), href: "/therapist/bookings" },
    { label: "Rating", value: `★ ${Number(t?.rating_avg ?? 0).toFixed(1)} (${t?.rating_count ?? 0})`, href: "/therapist/profile" },
    { label: "Total earned", value: formatAED(totalEarnings), href: "/therapist/earnings" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hi, {profile.full_name} 👋</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition hover:border-emerald-400">
              <CardContent className="p-4">
                <p className="text-xs text-neutral-500">{s.label}</p>
                <p className="mt-1 text-lg font-bold">{s.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {(pendingCount ?? 0) > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm font-medium text-amber-900">
              You have {pendingCount} booking request{pendingCount === 1 ? "" : "s"} waiting for
              your response.
            </p>
            <Link
              href="/therapist/bookings"
              className="text-sm font-semibold text-amber-900 underline"
            >
              Review →
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <p className="mb-3 font-semibold">Next confirmed sessions</p>
          {(!upcoming || upcoming.length === 0) && (
            <p className="text-sm text-neutral-500">No upcoming confirmed sessions.</p>
          )}
          <div className="space-y-2">
            {upcoming?.map((b) => (
              <div key={b.id} className="flex justify-between rounded-lg border p-3 text-sm">
                <span>
                  {new Date(b.booking_date).toLocaleDateString()} ·{" "}
                  {String(b.start_time).slice(0, 5)} · {b.duration_min}min
                </span>
                <span className="text-neutral-500">{b.area ?? b.address_text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
