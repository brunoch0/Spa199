"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const REPORT_REASONS = [
  "Spam or advertising",
  "Offensive language",
  "Contains personal information",
  "Fake or misleading review",
  "Other",
];

export function ReportReviewButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_id", user.id)
      .single();
    if (!profile) {
      setBusy(false);
      return toast.error("Please log in first");
    }

    const { error } = await supabase.from("review_reports").insert({
      review_id: reviewId,
      reporter_id: profile.id,
      reason,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Report submitted — our team will review it.");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-neutral-400 hover:text-red-500">Report</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this review</DialogTitle>
        </DialogHeader>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPORT_REASONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={busy} onClick={submit}>
            {busy ? "Submitting…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
