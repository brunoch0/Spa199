import Stripe from "stripe";

// Stripe activates automatically once STRIPE_SECRET_KEY is set (Vercel env).
// Until then the app runs in demo-payment mode.
export function isStripeEnabled() {
  return !!process.env.STRIPE_SECRET_KEY;
}

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing)");
  }
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}
