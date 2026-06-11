"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

  async function savePhotos(next: string[]) {
    const { error } = await supabase
      .from("therapists")
      .update({ photos: next })
      .eq("id", therapistId);
    if (error) return toast.error(error.message);
    onChange(next);
  }

  async function upload(file: File) {
    if (photos.length >= 10) return toast.error("Max 10 photos");
    setBusy(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `gallery/${therapistId}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    await savePhotos([...photos, data.publicUrl]);
    setBusy(false);
    toast.success("Photo added");
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Gallery (shown on your public profile)</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {photos.map((url) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border">
            <Image src={url} alt="Gallery photo" fill className="object-cover" unoptimized />
            <button
              onClick={() => savePhotos(photos.filter((p) => p !== url))}
              className="absolute top-1 right-1 hidden size-6 items-center justify-center rounded-full bg-black/60 text-xs text-white group-hover:flex"
            >
              ✕
            </button>
          </div>
        ))}
        {photos.length < 10 && (
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
