import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, isStripeEnabled } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  if (!isStripeEnabled()) return NextResponse.json({ ok: true, skipped: "stripe disabled" });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "service role missing" }, { status: 500 });

  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return NextResponse.json({ error: "no signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    if (bookingId) {
      const { data: booking } = await admin
        .from("bookings")
        .select("price_aed")
        .eq("id", bookingId)
        .single();
      await admin.from("payments").insert({
        booking_id: bookingId,
        amount_aed: booking?.price_aed ?? (session.amount_total ?? 0) / 100,
        method: "card",
        status: "authorized",
        stripe_payment_intent_id: String(session.payment_intent),
        stripe_session_id: session.id,
      });
    }
  }

  if (event.type === "checkout.session.expired") {
    // customer abandoned checkout — release the unpaid booking
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    if (bookingId) {
      await admin
        .from("bookings")
        .update({ status: "expired", cancel_reason: "Checkout not completed" })
        .eq("id", bookingId)
        .eq("status", "requested");
    }
  }

  if (event.type === "payment_intent.canceled") {
    const pi = event.data.object as Stripe.PaymentIntent;
    await admin
      .from("payments")
      .update({ status: "cancelled" })
      .eq("stripe_payment_intent_id", pi.id);
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    if (charge.payment_intent) {
      await admin
        .from("payments")
        .update({
          status: charge.amount_refunded === charge.amount ? "refunded" : "partially_refunded",
          refund_amount_aed: charge.amount_refunded / 100,
        })
        .eq("stripe_payment_intent_id", String(charge.payment_intent));
    }
  }

  return NextResponse.json({ received: true });
}
