import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatAED } from "@/lib/constants";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: therapistCount },
    { count: bookingCount },
    { data: bookings },
    { count: openInquiries },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "therapist"),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("status, price_aed, refund_amount_aed"),
    supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .neq("status", "resolved"),
  ]);

  const all = bookings ?? [];
  const completed = all.filter((b) => b.status === "completed");
  const cancelled = all.filter((b) => b.status === "cancelled");
  const gmv = completed.reduce((s, b) => s + Number(b.price_aed), 0);
  const refunds = cancelled.reduce((s, b) => s + Number(b.refund_amount_aed ?? 0), 0);
  const cancelRate = all.length ? Math.round((cancelled.length / all.length) * 100) : 0;

  const kpis = [
    ["Customers", String(userCount ?? 0)],
    ["Therapists", String(therapistCount ?? 0)],
    ["Total bookings", String(bookingCount ?? 0)],
    ["Completed GMV", formatAED(gmv)],
    ["Cancellation rate", `${cancelRate}%`],
    ["Refunded", formatAED(refunds)],
    ["Open inquiries", String(openInquiries ?? 0)],
    ["Take rate (20%)", formatAED(Math.round(gmv * 0.2))],
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin overview</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-neutral-500">{label}</p>
              <p className="mt-1 text-lg font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
