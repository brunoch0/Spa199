"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isStripeEnabled } from "@/lib/stripe";
import { calcRefund } from "@/lib/refund";

// Customer cancels. Pre-acceptance: release the hold in full.
// Post-acceptance: partial refund per the 48/24h policy.
export async function cancelBooking(bookingId: string): Promise<{ error?: string; refundAed?: number }> {
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, booking_date, start_time, price_aed")
    .eq("id", bookingId)
    .single();
  if (!booking) return { error: "Booking not found" };
  if (!["requested", "confirmed"].includes(booking.status)) {
    return { error: "This booking can no longer be cancelled" };
  }

  // pre-acceptance cancellations always release in full
  const refund =
    booking.status === "requested"
      ? { refundAed: Number(booking.price_aed), ratePct: 100 }
      : calcRefund(booking.booking_date, booking.start_time, Number(booking.price_aed));

  if (isStripeEnabled()) {
    const admin = createAdminClient();
    const { data: payment } = (await admin
      ?.from("payments")
      .select("stripe_payment_intent_id, status")
      .eq("booking_id", bookingId)
      .maybeSingle()) ?? { data: null };

    const pi = payment?.stripe_payment_intent_id;
    if (pi) {
      try {
        if (payment?.status === "authorized") {
          await getStripe().paymentIntents.cancel(pi); // full release, no fee
        } else if (payment?.status === "paid" && refund.refundAed > 0) {
          await getStripe().refunds.create({
            payment_intent: pi,
            amount: refund.refundAed * 100,
          });
        }
      } catch (e) {
        return { error: `Refund failed: ${e instanceof Error ? e.message : "unknown"}` };
      }
    }
  } else {
    // demo mode: keep payments table in sync
    await supabase
      .from("payments")
      .update({
        status:
          refund.ratePct === 100 ? "refunded" : refund.ratePct > 0 ? "partially_refunded" : "paid",
        refund_amount_aed: refund.refundAed,
      })
      .eq("booking_id", bookingId);
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancel_reason: "Cancelled by customer",
      refund_amount_aed: refund.refundAed,
    })
    .eq("id", bookingId);

  return error ? { error: error.message } : { refundAed: refund.refundAed };
}
