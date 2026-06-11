"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function UserStatusButton({
  profileId,
  status,
}: {
  profileId: string;
  status: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const newStatus = status === "active" ? "suspended" : "active";
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", profileId);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(newStatus === "suspended" ? "Account suspended" : "Account reactivated");
    router.refresh();
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={busy}
      onClick={toggle}
      className={status === "active" ? "text-red-600" : "text-emerald-600"}
    >
      {status === "active" ? "Suspend" : "Reactivate"}
    </Button>
  );
}
