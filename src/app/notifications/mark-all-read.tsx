"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function MarkAllReadButton({
  profileId,
  label,
}: {
  profileId: string;
  label: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function markAll() {
    setBusy(true);
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("profile_id", profileId)
      .eq("read", false);
    setBusy(false);
    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" disabled={busy} onClick={markAll}>
      {label}
    </Button>
  );
}
