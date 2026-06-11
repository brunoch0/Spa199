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
import { TherapistBookingActions } from "./actions-client";

export default async function TherapistBookingsPage() {
  const profile = (await getCurrentProfile())!;
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, customer:profiles!bookings_customer_id_fkey(full_name, phone)")
    .eq("therapist_id", profile.id)
    .order("booking_date", { ascending: false })
    .order("start_time", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Bookings</h1>
      {(!bookings || bookings.length === 0) && (
        <Card>
          <CardContent className="p-10 text-center text-neutral-500">
            No bookings yet. Make sure your profile and schedule are complete.
          </CardContent>
        </Card>
      )}
      {bookings?.map((b) => (
        <Card key={b.id}>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">
                  {serviceLabel(b.service_type)} · {b.duration_min} min ·{" "}
                  <span className="text-[var(--text-gold)]">{formatAED(b.price_aed)}</span>
                </p>
                <p className="text-sm text-neutral-500">
                  {new Date(b.booking_date).toLocaleDateString()} ·{" "}
                  {String(b.start_time).slice(0, 5)}–{String(b.end_time).slice(0, 5)}
                </p>
                <p className="text-sm text-neutral-500">
                  {b.customer?.full_name}
                  {b.status === "confirmed" && b.customer?.phone ? ` · ${b.customer.phone}` : ""}
                </p>
                <p className="mt-1 text-sm">
                  📍 {b.address_text}
                  {b.area ? ` (${b.area})` : ""}
                </p>
                {b.visit_notes && (
                  <p className="mt-1 text-sm text-neutral-600">📝 {b.visit_notes}</p>
                )}
              </div>
              <Badge className={BOOKING_STATUS_COLOR[b.status]}>
                {BOOKING_STATUS_LABEL[b.status]}
              </Badge>
            </div>
            <TherapistBookingActions
              bookingId={b.id}
              status={b.status}
              bookingDate={b.booking_date}
              endTime={b.end_time}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
