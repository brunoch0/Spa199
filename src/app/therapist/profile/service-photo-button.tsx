"use client";

import { useRef, useState } from "react";
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

    const { error: updateError } = await supabase
      .from("therapist_services")
      .update({ photo_url: data.publicUrl })
      .eq("id", serviceId);
    setBusy(false);
    if (updateError) return toast.error(updateError.message);

    onChange(data.publicUrl);
    toast.success("Menu photo updated");
  }

  async function remove() {
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
      {photoUrl ? (
        <div className="group relative size-12 shrink-0 overflow-hidden rounded-lg border">
          <Image src={photoUrl} alt="Menu photo" fill className="object-cover" unoptimized />
          <button
            onClick={remove}
            className="absolute inset-0 hidden items-center justify-center bg-black/50 text-xs text-white group-hover:flex"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          title="Add menu photo"
          className="flex size-12 shrink-0 items-center justify-center rounded-lg border-2 border-dashed text-lg text-neutral-400 transition hover:border-[var(--gold-400)] hover:text-[var(--text-gold)]"
        >
          {busy ? "…" : "📷"}
        </button>
      )}
    </div>
  );
}
