import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/photos", label: "Photos" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/notices", label: "Notices" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/admin");
  if (profile.role !== "admin") redirect("/");

  return (
    <div className="space-y-4">
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
