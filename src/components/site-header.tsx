import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerDict } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export async function SiteHeader() {
  const [profile, { dict }] = await Promise.all([getCurrentProfile(), getServerDict()]);

  let unread = 0;
  if (profile) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profile.id)
      .eq("read", false);
    unread = count ?? 0;
  }

  const homeByRole =
    profile?.role === "admin"
      ? "/admin"
      : profile?.role === "therapist"
        ? "/therapist"
        : "/";

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href={homeByRole} className="text-lg font-bold tracking-tight">
          spa<span className="text-emerald-600">199</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {(!profile || profile.role === "customer") && (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/search">{dict.findTherapist}</Link>
              </Button>
              {profile && (
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/bookings">{dict.myBookings}</Link>
                </Button>
              )}
            </>
          )}
          {profile?.role === "therapist" && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/therapist/bookings">Bookings</Link>
            </Button>
          )}
          {profile?.role === "admin" && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin">Dashboard</Link>
            </Button>
          )}

          {profile && (
            <Link
              href="/notifications"
              className="relative rounded-lg p-2 text-neutral-600 transition hover:bg-neutral-100"
              aria-label={dict.notifications}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          )}

          {profile ? (
            <Link href="/account" className="ml-1">
              <Avatar className="size-8">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback>{profile.full_name.slice(0, 1)}</AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{dict.login}</Link>
              </Button>
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Link href="/signup">{dict.signup}</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
