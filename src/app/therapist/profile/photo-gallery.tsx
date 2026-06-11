"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface PendingPhoto {
  id: string;
  url: string;
  status: string;
}

export function PhotoGallery({
  therapistId,
  photos,
  onChange,
}: {
  therapistId: string;
  photos: string[];
  onChange: (photos: string[]) => void;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingPhoto[]>([]);

  useEffect(() => {
    supabase
      .from("media_reviews")
      .select("id, url, status")
      .eq("therapist_id", therapistId)
      .eq("kind", "gallery")
      .eq("status", "pending")
      .then(({ data }) => setPending(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [therapistId]);

  async function removeLive(url: string) {
    const next = photos.filter((p) => p !== url);
    const { error } = await supabase
      .from("therapists")
      .update({ photos: next })
      .eq("id", therapistId);
    if (error) return toast.error(error.message);
    onChange(next);
  }

  async function withdrawPending(id: string) {
    const { error } = await supabase.from("media_reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPending((prev) => prev.filter((p) => p.id !== id));
  }

  async function upload(file: File) {
    if (photos.length + pending.length >= 10) return toast.error("Max 10 photos");
    setBusy(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `gallery/${therapistId}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);

    const { data: review, error: reviewError } = await supabase
      .from("media_reviews")
      .insert({ therapist_id: therapistId, url: data.publicUrl, kind: "gallery" })
      .select("id, url, status")
      .single();
    setBusy(false);
    if (reviewError) return toast.error(reviewError.message);

    setPending((prev) => [...prev, review]);
    toast.success("Photo submitted for review — it goes live once approved.");
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Gallery (shown on your public profile)</p>
      <p className="text-xs text-muted-foreground">
        📸 Photo guidelines: treatment setups, your workspace, certificates, or professional
        portraits. New photos are reviewed by our team before going live (usually within 24h).
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {photos.map((url) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border">
            <Image src={url} alt="Gallery photo" fill className="object-cover" unoptimized />
            <button
              onClick={() => removeLive(url)}
              className="absolute top-1 right-1 hidden size-6 items-center justify-center rounded-full bg-black/60 text-xs text-white group-hover:flex"
            >
              ✕
            </button>
          </div>
        ))}
        {pending.map((p) => (
          <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg border border-amber-300">
            <Image src={p.url} alt="Pending photo" fill className="object-cover opacity-60" unoptimized />
            <span className="absolute inset-x-0 bottom-0 bg-amber-500/90 py-0.5 text-center text-[10px] font-semibold text-white">
              IN REVIEW
            </span>
            <button
              onClick={() => withdrawPending(p.id)}
              className="absolute top-1 right-1 hidden size-6 items-center justify-center rounded-full bg-black/60 text-xs text-white group-hover:flex"
            >
              ✕
            </button>
          </div>
        ))}
        {photos.length + pending.length < 10 && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed text-2xl text-neutral-400 transition hover:border-[var(--gold-400)] hover:text-[var(--text-gold)]"
          >
            {busy ? "…" : "+"}
          </button>
        )}
      </div>
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
    </div>
  );
}
