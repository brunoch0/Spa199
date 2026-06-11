"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AvatarUpload({
  profileId,
  avatarUrl,
  fallback,
  onUploaded,
}: {
  profileId: string;
  avatarUrl: string | null;
  fallback: string;
  onUploaded?: (url: string) => void;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(avatarUrl);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `avatars/${profileId}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("media").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }

    const { data } = supabase.storage.from("media").getPublicUrl(path);
    const publicUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", profileId);
    setBusy(false);
    if (updateError) return toast.error(updateError.message);

    setUrl(publicUrl);
    onUploaded?.(publicUrl);
    toast.success("Photo updated");
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-20">
        <AvatarImage src={url ?? undefined} />
        <AvatarFallback className="text-2xl">{fallback}</AvatarFallback>
      </Avatar>
      <div>
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Uploading…" : "Change photo"}
        </Button>
        <p className="mt-1 text-xs text-neutral-500">JPG/PNG, max 5MB</p>
      </div>
    </div>
  );
}
