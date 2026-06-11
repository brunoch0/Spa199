import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isStripeEnabled } from "@/lib/stripe";

// Expires booking requests the therapist ignored for 12h+ and releases any card hold.
// Runs alongside (and eventually replaces) the pg_cron job, which can't talk to Stripe.
export async function GET(req: Request) {
  if (process.env.CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: true, skipped: "service role not configured" });

  const cutoff = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
  const { data: stale } = await admin
    .from("bookings")
    .select("id, price_aed")
    .eq("status", "requested")
    .lt("created_at", cutoff);

  let expired = 0;
  for (const b of stale ?? []) {
    if (isStripeEnabled()) {
      const { data: payment } = await admin
        .from("payments")
        .select("stripe_payment_intent_id, status")
        .eq("booking_id", b.id)
        .maybeSingle();
      if (payment?.stripe_payment_intent_id && payment.status === "authorized") {
        try {
          await getStripe().paymentIntents.cancel(payment.stripe_payment_intent_id);
        } catch {
          // already resolved
        }
      }
    } else {
      await admin
        .from("payments")
        .update({ status: "refunded", refund_amount_aed: b.price_aed })
        .eq("booking_id", b.id);
    }

    await admin
      .from("bookings")
      .update({ status: "expired", refund_amount_aed: b.price_aed })
      .eq("id", b.id)
      .eq("status", "requested");
    expired++;
  }

  return NextResponse.json({ ok: true, expired });
}
