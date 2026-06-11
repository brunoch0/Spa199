"use server";

import { createClient } from "@/lib/supabase/server";
import { getStripe, isStripeEnabled } from "@/lib/stripe";

interface BookingInput {
  therapistId: string;
  serviceId: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  address: string;
  area: string | null;
  notes: string | null;
  payMethod: string;
}

interface Result {
  error?: string;
  mode?: "demo" | "stripe";
  bookingId?: string;
  checkoutUrl?: string;
}

// Creates the booking server-side (price recomputed from DB — client values are not
// trusted) and either records a demo payment or returns a Stripe Checkout URL
// (manual capture: card held now, charged when the therapist accepts).
export async function createBookingCheckout(input: BookingInput): Promise<Result> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in first." };

  const { data: me } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("auth_id", user.id)
    .single();
  if (!me) return { error: "Profile not found." };

  const { data: service } = await supabase
    .from("therapist_services")
    .select("id, therapist_id, service_type, duration_min, price_aed")
    .eq("id", input.serviceId)
    .single();
  if (!service || service.therapist_id !== input.therapistId) {
    return { error: "Service not found." };
  }

  // first-booking promo: 20% off, computed server-side
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", me.id);
  const isFirst = (count ?? 0) === 0;
  const finalPrice = Math.round(Number(service.price_aed) * (isFirst ? 0.8 : 1));

  const [h, m] = input.startTime.split(":").map(Number);
  const endMin = h * 60 + m + service.duration_min;
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: me.id,
      therapist_id: input.therapistId,
      service_id: service.id,
      service_type: service.service_type,
      duration_min: service.duration_min,
      price_aed: finalPrice,
      booking_date: input.bookingDate,
      start_time: input.startTime,
      end_time: endTime,
      address_text: input.address,
      area: input.area,
      visit_notes: input.notes,
      status: "requested",
    })
    .select("id")
    .single();
  if (error || !booking) return { error: error?.message ?? "Booking failed" };

  if (!isStripeEnabled()) {
    // demo payment
    const { error: payError } = await supabase.from("payments").insert({
      booking_id: booking.id,
      amount_aed: finalPrice,
      method: input.payMethod,
      status: "paid",
    });
    if (payError) return { error: payError.message };
    return { mode: "demo", bookingId: booking.id };
  }

  // Stripe Checkout — card authorised now, captured on therapist acceptance
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://spa199.vercel.app";
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    currency: "aed",
    customer_email: me.email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "aed",
          unit_amount: finalPrice * 100,
          product_data: {
            name: `${service.service_type.replace(/_/g, " ")} massage · ${service.duration_min} min`,
            description: `SPA199 booking ${input.bookingDate} ${input.startTime}`,
          },
        },
      },
    ],
    payment_intent_data: {
      capture_method: "manual",
      metadata: { booking_id: booking.id },
    },
    metadata: { booking_id: booking.id },
    success_url: `${origin}/bookings/${booking.id}?paid=1`,
    cancel_url: `${origin}/book/${input.therapistId}?cancelled=1`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });

  return { mode: "stripe", bookingId: booking.id, checkoutUrl: session.url ?? undefined };
}
