import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BOOKING_STATUS_COLOR,
  BOOKING_STATUS_LABEL,
  serviceLabel,
  formatAED,
} from "@/lib/constants";

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "*, customer:profiles!bookings_customer_id_fkey(full_name), therapist:therapists(profile:profiles!therapists_id_fkey(full_name))"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Bookings & payments</h1>
      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Therapist</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Refund</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings?.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  {new Date(b.booking_date).toLocaleDateString()}{" "}
                  {String(b.start_time).slice(0, 5)}
                </TableCell>
                <TableCell>{b.customer?.full_name}</TableCell>
                <TableCell>{b.therapist?.profile?.full_name}</TableCell>
                <TableCell>
                  {serviceLabel(b.service_type)} {b.duration_min}min
                </TableCell>
                <TableCell>
                  <Badge className={BOOKING_STATUS_COLOR[b.status]}>
                    {BOOKING_STATUS_LABEL[b.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatAED(b.price_aed)}</TableCell>
                <TableCell className="text-right text-neutral-500">
                  {b.refund_amount_aed ? formatAED(b.refund_amount_aed) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
