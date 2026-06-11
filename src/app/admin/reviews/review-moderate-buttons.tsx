"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ReviewModerateButtons({
  reviewId,
  status,
}: {
  reviewId: string;
  status: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function setStatus(newStatus: "published" | "hidden") {
    setBusy(true);
    const { error } = await supabase
      .from("reviews")
      .update({ status: newStatus })
      .eq("id", reviewId);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(newStatus === "published" ? "Review published" : "Review hidden");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {status !== "published" && (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus("published")} className="text-emerald-600">
          Publish
        </Button>
      )}
      {status !== "hidden" && (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus("hidden")} className="text-red-600">
          Hide
        </Button>
      )}
    </div>
  );
}
