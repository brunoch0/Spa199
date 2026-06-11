import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BOOKING_STATUS_COLOR,
  BOOKING_STATUS_LABEL,
  serviceLabel,
  formatAED,
} from "@/lib/constants";

export default async function BookingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/bookings");

  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, therapist:therapists(id, profile:profiles(full_name, avatar_url))")
    .eq("customer_id", profile.id)
    .order("booking_date", { ascending: false })
    .order("start_time", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">My bookings</h1>
      {(!bookings || bookings.length === 0) && (
        <Card>
          <CardContent className="p-10 text-center text-neutral-500">
            No bookings yet.{" "}
            <Link href="/search" className="font-medium text-[var(--text-gold)] hover:underline">
              Find a therapist →
            </Link>
          </CardContent>
        </Card>
      )}
      {bookings?.map((b) => (
        <Link key={b.id} href={`/bookings/${b.id}`} className="block">
          <Card className="transition hover:border-[var(--gold-400)] hover:shadow-sm">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">
                  {serviceLabel(b.service_type)} · {b.duration_min} min
                </p>
                <p className="text-sm text-neutral-500">
                  with {b.therapist?.profile?.full_name}
                </p>
                <p className="text-sm text-neutral-500">
                  {new Date(b.booking_date).toLocaleDateString()} ·{" "}
                  {String(b.start_time).slice(0, 5)}
                </p>
              </div>
              <div className="text-right">
                <Badge className={BOOKING_STATUS_COLOR[b.status]}>
                  {BOOKING_STATUS_LABEL[b.status]}
                </Badge>
                <p className="mt-1 text-sm font-semibold">{formatAED(b.price_aed)}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
