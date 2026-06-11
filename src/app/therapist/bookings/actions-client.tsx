"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function update(newStatus: string, successMsg: string) {
    setBusy(true);
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);
    setBusy(false);
    if (error) return toast.error(error.message);
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
          onClick={() => update("confirmed", "Booking accepted ✓")}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => update("rejected", "Booking declined")}
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
        onClick={() => update("completed", "Marked as completed — customer can now review")}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Mark completed
      </Button>
    );
  }

  return null;
}
