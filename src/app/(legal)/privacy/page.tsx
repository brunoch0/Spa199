export const metadata = { title: "Privacy Policy — SPA199" };

export default function PrivacyPage() {
  return (
    <>
      <p className="t-overline">SPA199</p>
      <h1>Privacy Policy</h1>
      <p>Last updated: June 2026</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account data:</strong> name, email, phone number, preferred language.</li>
        <li><strong>Booking data:</strong> service address, visit notes, booking history.</li>
        <li><strong>Payment data:</strong> processed securely by our payment provider (Stripe). We never store full card numbers.</li>
        <li><strong>Content you submit:</strong> reviews, photos, support requests.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To match you with therapists and fulfil bookings (your address is shared with your confirmed therapist only).</li>
        <li>To process payments and refunds.</li>
        <li>To send booking notifications through the channels you enable.</li>
        <li>To keep the platform safe (fraud prevention, review moderation).</li>
      </ul>

      <h2>Sharing</h2>
      <p>
        We share data only with: the therapist fulfilling your booking (name, address, visit
        notes), our payment processor (Stripe), and our infrastructure providers (Supabase,
        Vercel). We never sell personal data.
      </p>

      <h2>Retention & your rights</h2>
      <p>
        We keep account data while your account is active. You can update your details in
        Account Settings, or request export or deletion of your data at any time by
        contacting support@spa199.ae. We comply with UAE Federal Decree-Law No. 45 of 2021
        on Personal Data Protection.
      </p>

      <h2>Cookies</h2>
      <p>
        We use essential cookies only: session authentication and your language preference.
        No advertising trackers.
      </p>

      <h2>Contact</h2>
      <p>SPA199 · Dubai, United Arab Emirates · support@spa199.ae</p>
    </>
  );
}
