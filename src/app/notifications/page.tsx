import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerDict } from "@/lib/i18n/server";
import { Card, CardContent } from "@/components/ui/card";
import { MarkAllReadButton } from "./mark-all-read";

export default async function NotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/notifications");
  const { dict } = await getServerDict();

  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const hasUnread = notifications?.some((n) => !n.read);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{dict.notifications}</h1>
        {hasUnread && <MarkAllReadButton profileId={profile.id} label={dict.markAllRead} />}
      </div>

      {(!notifications || notifications.length === 0) && (
        <Card>
          <CardContent className="p-10 text-center text-neutral-500">
            {dict.noNotifications}
          </CardContent>
        </Card>
      )}

      {notifications?.map((n) => (
        <Link key={n.id} href={n.link ?? "#"} className="block">
          <Card className={`transition hover:border-[var(--gold-400)] ${n.read ? "opacity-60" : "border-[var(--gold-200)]"}`}>
            <CardContent className="flex items-start gap-3 p-4">
              {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--gold-400)]" />}
              <div className={n.read ? "ps-5" : ""}>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-neutral-600">{n.body}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
