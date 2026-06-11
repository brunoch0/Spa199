"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function InquiryReplyForm({ inquiryId }: { inquiryId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  async function resolve() {
    setBusy(true);
    const { error } = await supabase
      .from("inquiries")
      .update({
        admin_reply: reply,
        status: "resolved",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", inquiryId);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Inquiry resolved");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Write a reply to the user…"
        rows={2}
        className="flex-1"
      />
      <Button disabled={busy || !reply.trim()} onClick={resolve} className="self-end">
        {busy ? "…" : "Reply & resolve"}
      </Button>
    </div>
  );
}
