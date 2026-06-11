import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

const NAV = [
  { href: "/therapist", label: "Dashboard" },
  { href: "/therapist/bookings", label: "Bookings" },
  { href: "/therapist/profile", label: "Profile" },
  { href: "/therapist/schedule", label: "Schedule" },
  { href: "/therapist/earnings", label: "Earnings" },
];

export default async function TherapistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/therapist");
  if (profile.role !== "therapist" && profile.role !== "admin") redirect("/");

  let pendingReview = false;
  if (profile.role === "therapist") {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: t } = await supabase
      .from("therapists")
      .select("is_approved")
      .eq("id", profile.id)
      .single();
    pendingReview = t ? !t.is_approved : false;
  }

  return (
    <div className="space-y-4">
      {pendingReview && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">Profile under review.</span> Complete your profile,
          services and schedule — our team verifies new therapists before they appear in
          search. You&apos;ll be notified once approved.
        </div>
      )}
      <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-white p-1">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-[var(--gold-50)] hover:text-[var(--text-gold)]"
          >
            {n.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
