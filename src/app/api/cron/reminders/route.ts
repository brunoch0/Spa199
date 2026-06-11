import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const REMINDER_TITLE_24 = "Session tomorrow 🌿";
const REMINDER_TITLE_2 = "Session starting soon";

// Hourly: in-app reminders 24h and 2h before confirmed sessions (guest + therapist).
// Dedupe by checking for an existing notification with the same title + link.
export async function GET(req: Request) {
  if (process.env.CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: true, skipped: "service role not configured" });

  const now = Date.now();
  const { data: upcoming } = await admin
    .from("bookings")
    .select("id, customer_id, therapist_id, service_type, booking_date, start_time, area, address_text")
    .eq("status", "confirmed")
    .gte("booking_date", new Date(now - 864e5).toISOString().slice(0, 10))
    .lte("booking_date", new Date(now + 2 * 864e5).toISOString().slice(0, 10));

  let sent = 0;
  for (const b of upcoming ?? []) {
    // Dubai local session time (GST = UTC+4)
    const start = new Date(`${b.booking_date}T${b.start_time}+04:00`).getTime();
    const hoursUntil = (start - now) / 36e5;

    const windows: { title: string; lead: string }[] = [];
    if (hoursUntil > 22 && hoursUntil <= 25) windows.push({ title: REMINDER_TITLE_24, lead: "tomorrow" });
    if (hoursUntil > 1 && hoursUntil <= 3) windows.push({ title: REMINDER_TITLE_2, lead: "soon" });

    for (const w of windows) {
      const when = `${b.booking_date} ${String(b.start_time).slice(0, 5)}`;
      const targets = [
        {
          profile_id: b.customer_id,
          link: `/bookings/${b.id}`,
          body: `Your ${b.service_type.replace(/_/g, " ")} session is ${w.lead === "tomorrow" ? "tomorrow" : "starting soon"} — ${when}.`,
        },
        {
          profile_id: b.therapist_id,
          link: "/therapist/bookings",
          body: `Session ${w.lead === "tomorrow" ? "tomorrow" : "starting soon"}: ${when} · ${b.area ?? b.address_text}.`,
        },
      ];

      for (const t of targets) {
        const { data: existing } = await admin
          .from("notifications")
          .select("id")
          .eq("profile_id", t.profile_id)
          .eq("title", w.title)
          .eq("link", t.link)
          .gte("created_at", new Date(now - 26 * 36e5).toISOString())
          .maybeSingle();
        if (existing) continue;

        await admin.from("notifications").insert({
          profile_id: t.profile_id,
          title: w.title,
          body: t.body,
          link: t.link,
        });
        sent++;
      }
    }
  }

  return NextResponse.json({ ok: true, sent });
}
