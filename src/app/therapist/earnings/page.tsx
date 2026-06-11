import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { serviceLabel, formatAED } from "@/lib/constants";

const PLATFORM_FEE_PCT = 20;

export default async function EarningsPage() {
  const profile = (await getCurrentProfile())!;
  const supabase = await createClient();

  const { data: completed } = await supabase
    .from("bookings")
    .select("*")
    .eq("therapist_id", profile.id)
    .eq("status", "completed")
    .order("booking_date", { ascending: false });

  const gross = (completed ?? []).reduce((sum, b) => sum + Number(b.price_aed), 0);
  const fee = Math.round((gross * PLATFORM_FEE_PCT) / 100);
  const net = gross - fee;

  const thisMonth = (completed ?? []).filter((b) =>
    b.booking_date.startsWith(new Date().toISOString().slice(0, 7))
  );
  const monthGross = thisMonth.reduce((sum, b) => sum + Number(b.price_aed), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Earnings & payouts</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["This month", formatAED(monthGross)],
          ["Total gross", formatAED(gross)],
          [`Platform fee (${PLATFORM_FEE_PCT}%)`, `− ${formatAED(fee)}`],
          ["Net payout", formatAED(net)],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-neutral-500">{label}</p>
              <p className="mt-1 text-lg font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Completed sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Area</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completed?.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{new Date(b.booking_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {serviceLabel(b.service_type)} {b.duration_min}min
                  </TableCell>
                  <TableCell>{b.area ?? "—"}</TableCell>
                  <TableCell className="text-right">{formatAED(b.price_aed)}</TableCell>
                  <TableCell className="text-right font-medium text-[var(--text-gold)]">
                    {formatAED(Math.round(Number(b.price_aed) * (1 - PLATFORM_FEE_PCT / 100)))}
                  </TableCell>
                </TableRow>
              ))}
              {(!completed || completed.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-neutral-500">
                    No completed sessions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-neutral-500">
            Payouts are processed weekly to your registered bank account. Demo: payout
            scheduling is not yet enabled.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
