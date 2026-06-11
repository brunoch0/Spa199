"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isStripeEnabled } from "@/lib/stripe";

async function getPaymentIntent(bookingId: string): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("payments")
    .select("stripe_payment_intent_id, status")
    .eq("booking_id", bookingId)
    .maybeSingle();
  return data?.stripe_payment_intent_id ?? null;
}

// Therapist accepts: capture the card hold (Stripe mode), then confirm.
export async function acceptBooking(bookingId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  if (isStripeEnabled()) {
    const pi = await getPaymentIntent(bookingId);
    if (pi) {
      try {
        await getStripe().paymentIntents.capture(pi);
        await createAdminClient()
          ?.from("payments")
          .update({ status: "paid" })
          .eq("stripe_payment_intent_id", pi);
      } catch (e) {
        return { error: `Payment capture failed: ${e instanceof Error ? e.message : "unknown"}` };
      }
    }
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", bookingId)
    .eq("status", "requested");
  return error ? { error: error.message } : {};
}

// Therapist declines: release the hold — the guest is never charged.
export async function declineBooking(bookingId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  if (isStripeEnabled()) {
    const pi = await getPaymentIntent(bookingId);
    if (pi) {
      try {
        await getStripe().paymentIntents.cancel(pi);
      } catch {
        // already captured/cancelled — webhook keeps payments in sync
      }
    }
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "rejected" })
    .eq("id", bookingId)
    .eq("status", "requested");
  return error ? { error: error.message } : {};
}

export async function completeBooking(bookingId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ status: "completed" })
    .eq("id", bookingId)
    .eq("status", "confirmed");
  return error ? { error: error.message } : {};
}
