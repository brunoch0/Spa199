import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  BOOKING_STATUS_COLOR,
  BOOKING_STATUS_LABEL,
  serviceLabel,
  formatAED,
} from "@/lib/constants";
import { BookingActions } from "./booking-actions";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const [{ data: b }, { data: payment }, { data: review }, { data: inquiries }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("*, therapist:therapists(id, profile:profiles(full_name, avatar_url))")
        .eq("id", id)
        .single(),
      supabase.from("payments").select("*").eq("booking_id", id).maybeSingle(),
      supabase.from("reviews").select("*").eq("booking_id", id).maybeSingle(),
      supabase
        .from("inquiries")
        .select("*")
        .eq("booking_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (!b) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/bookings" className="text-sm text-neutral-500 hover:underline">
        ← My bookings
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {serviceLabel(b.service_type)} · {b.duration_min} min
          </CardTitle>
          <Badge className={BOOKING_STATUS_COLOR[b.status]}>
            {BOOKING_STATUS_LABEL[b.status]}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarImage src={b.therapist?.profile?.avatar_url ?? undefined} />
              <AvatarFallback>{b.therapist?.profile?.full_name?.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{b.therapist?.profile?.full_name}</p>
              <Link
                href={`/therapists/${b.therapist_id}`}
                className="text-sm text-[var(--text-gold)] hover:underline"
              >
                View profile
              </Link>
            </div>
          </div>

          <Separator />

          <div className="grid gap-2 text-sm">
            <p>
              <span className="text-neutral-500">When:</span>{" "}
              {new Date(b.booking_date).toLocaleDateString()} ·{" "}
              {String(b.start_time).slice(0, 5)}–{String(b.end_time).slice(0, 5)}
            </p>
            <p>
              <span className="text-neutral-500">Where:</span> {b.address_text}
              {b.area ? ` (${b.area})` : ""}
            </p>
            {b.visit_notes && (
              <p>
                <span className="text-neutral-500">Notes:</span> {b.visit_notes}
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            <p className="flex justify-between">
              <span className="text-neutral-500">Total paid</span>
              <span className="font-semibold">{formatAED(b.price_aed)}</span>
            </p>
            {payment && (
              <p className="flex justify-between text-neutral-500">
                <span>
                  {payment.method} · {new Date(payment.paid_at).toLocaleString()}
                </span>
                <span>{payment.status}</span>
              </p>
            )}
            {b.refund_amount_aed !== null && (
              <p className="flex justify-between text-[var(--text-gold)]">
                <span>Refunded</span>
                <span>{formatAED(b.refund_amount_aed)}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <BookingActions
          booking={JSON.parse(JSON.stringify(b))}
          hasReview={!!review}
          profileId={profile.id}
        />
        {["completed", "cancelled", "rejected", "expired"].includes(b.status) && (
          <Link
            href={`/book/${b.therapist_id}`}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-[var(--action-gold-hover)]"
          >
            Book again ↻
          </Link>
        )}
      </div>

      {inquiries && inquiries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Support requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inquiries.map((q) => (
              <div key={q.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {q.type === "report" ? "🚩 Report" : "💬 Inquiry"}: {q.reason}
                  </p>
                  <Badge variant="secondary">{q.status.replace("_", " ")}</Badge>
                </div>
                <p className="mt-1 text-neutral-600">{q.detail}</p>
                {q.admin_reply && (
                  <p className="mt-2 rounded bg-[var(--gold-50)] p-2 text-[var(--gold-800)]">
                    <span className="font-medium">spa199:</span> {q.admin_reply}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
