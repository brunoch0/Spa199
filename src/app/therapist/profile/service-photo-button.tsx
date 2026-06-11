"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function ServicePhotoButton({
  serviceId,
  therapistId,
  photoUrl,
  onChange,
}: {
  serviceId: string;
  therapistId: string;
  photoUrl: string | null;
  onChange: (url: string | null) => void;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("media_reviews")
      .select("id, url")
      .eq("service_id", serviceId)
      .eq("kind", "service")
      .eq("status", "pending")
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPendingId(data.id);
          setPendingUrl(data.url);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  async function upload(file: File) {
    setBusy(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `services/${therapistId}-${serviceId}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);

    const { data: review, error: reviewError } = await supabase
      .from("media_reviews")
      .insert({
        therapist_id: therapistId,
        url: data.publicUrl,
        kind: "service",
        service_id: serviceId,
      })
      .select("id")
      .single();
    setBusy(false);
    if (reviewError) return toast.error(reviewError.message);

    setPendingId(review.id);
    setPendingUrl(data.publicUrl);
    toast.success("Menu photo submitted for review.");
  }

  async function withdrawPending() {
    if (!pendingId) return;
    const { error } = await supabase.from("media_reviews").delete().eq("id", pendingId);
    if (error) return toast.error(error.message);
    setPendingId(null);
    setPendingUrl(null);
  }

  async function removeLive() {
    const { error } = await supabase
      .from("therapist_services")
      .update({ photo_url: null })
      .eq("id", serviceId);
    if (error) return toast.error(error.message);
    onChange(null);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 5 * 1024 * 1024) return toast.error("Max file size is 5MB");
          upload(f);
        }}
      />
      {pendingUrl ? (
        <div
          className="group relative size-12 shrink-0 overflow-hidden rounded-lg border border-amber-300"
          title="In review"
        >
          <Image src={pendingUrl} alt="Pending menu photo" fill className="object-cover opacity-60" unoptimized />
          <span className="absolute inset-x-0 bottom-0 bg-amber-500/90 text-center text-[8px] font-bold text-white">
            REVIEW
          </span>
          <button
            onClick={withdrawPending}
            className="absolute top-0 right-0 hidden size-5 items-center justify-center rounded-bl bg-black/60 text-[10px] text-white group-hover:flex"
          >
            ✕
          </button>
        </div>
      ) : photoUrl ? (
        <div className="group relative size-12 shrink-0 overflow-hidden rounded-lg border">
          <Image src={photoUrl} alt="Menu photo" fill className="object-cover" unoptimized />
          <button
            onClick={removeLive}
            className="absolute inset-0 hidden items-center justify-center bg-black/50 text-xs text-white group-hover:flex"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          title="Add menu photo (reviewed before going live — use a photo of the treatment)"
          className="flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-dashed text-lg text-neutral-400 transition hover:border-[var(--gold-400)] hover:text-[var(--text-gold)]"
        >
          {busy ? "…" : "📷"}
        </button>
      )}
    </div>
  );
}
