"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { acceptBooking, declineBooking, completeBooking } from "./actions";

export function TherapistBookingActions({
  bookingId,
  status,
  bookingDate,
  endTime,
}: {
  bookingId: string;
  status: string;
  bookingDate: string;
  endTime: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(
    action: (id: string) => Promise<{ error?: string }>,
    successMsg: string
  ) {
    setBusy(true);
    const { error } = await action(bookingId);
    setBusy(false);
    if (error) return toast.error(error);
    toast.success(successMsg);
    router.refresh();
  }

  const sessionEnded = new Date(`${bookingDate}T${endTime}`) < new Date();

  if (status === "requested") {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={busy}
          onClick={() => run(acceptBooking, "Booking accepted ✓ — payment captured")}
         
        >
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => run(declineBooking, "Booking declined — hold released")}
          className="text-red-600 hover:text-red-700"
        >
          Decline
        </Button>
      </div>
    );
  }

  if (status === "confirmed" && sessionEnded) {
    return (
      <Button
        size="sm"
        disabled={busy}
        onClick={() => run(completeBooking, "Marked as completed — customer can now review")}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Mark completed
      </Button>
    );
  }

  return null;
}
