import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export async function SiteHeader() {
  const profile = await getCurrentProfile();

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
                <Link href="/search">Find a therapist</Link>
              </Button>
              {profile && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/bookings">My bookings</Link>
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
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
