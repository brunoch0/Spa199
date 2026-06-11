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

  return (
    <div className="space-y-4">
      <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-white p-1">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-emerald-50 hover:text-emerald-700"
          >
            {n.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
