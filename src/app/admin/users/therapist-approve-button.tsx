"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function TherapistApproveButton({
  therapistId,
  isApproved,
}: {
  therapistId: string;
  isApproved: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const { error } = await supabase
      .from("therapists")
      .update({ is_approved: !isApproved })
      .eq("id", therapistId);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(isApproved ? "Therapist unlisted" : "Therapist approved ✓");
    router.refresh();
  }

  return (
    <Button
      size="sm"
      variant={isApproved ? "outline" : "default"}
      disabled={busy}
      onClick={toggle}
      className={isApproved ? "text-neutral-500" : ""}
    >
      {isApproved ? "Unlist" : "Approve"}
    </Button>
  );
}
