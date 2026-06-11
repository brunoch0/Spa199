"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Review {
  id: string;
  therapist_id: string;
  url: string;
  kind: "avatar" | "gallery" | "service";
  service_id: string | null;
  therapist?: { photos: string[] } | null;
}

export function PhotoModerateButtons({ review }: { review: Review }) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function approve() {
    setBusy(true);

    // publish to the right place
    let publishError = null;
    if (review.kind === "avatar") {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: review.url })
        .eq("id", review.therapist_id);
      publishError = error;
    } else if (review.kind === "gallery") {
      const current = review.therapist?.photos ?? [];
      const { error } = await supabase
        .from("therapists")
        .update({ photos: [...current, review.url] })
        .eq("id", review.therapist_id);
      publishError = error;
    } else if (review.kind === "service" && review.service_id) {
      const { error } = await supabase
        .from("therapist_services")
        .update({ photo_url: review.url })
        .eq("id", review.service_id);
      publishError = error;
    }

    if (publishError) {
      setBusy(false);
      return toast.error(publishError.message);
    }

    const { error } = await supabase
      .from("media_reviews")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", review.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Approved — photo is live, therapist notified");
    router.refresh();
  }

  async function reject() {
    setBusy(true);
    const { error } = await supabase
      .from("media_reviews")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", review.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Rejected — therapist notified");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={busy} onClick={approve} className="flex-1">
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={reject}
        className="flex-1 text-red-600"
      >
        Reject
      </Button>
    </div>
  );
}
