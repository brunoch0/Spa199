"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function FavoriteButton({ therapistId }: { therapistId: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: me } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("auth_id", user.id)
        .single();
      if (!me || me.role !== "customer") return;
      setProfileId(me.id);
      const { data } = await supabase
        .from("favorites")
        .select("therapist_id")
        .eq("customer_id", me.id)
        .eq("therapist_id", therapistId)
        .maybeSingle();
      setIsFav(!!data);
    }
    load();
  }, [supabase, therapistId]);

  async function toggle() {
    if (!profileId) return router.push(`/login?next=/therapists/${therapistId}`);
    setBusy(true);
    if (isFav) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("customer_id", profileId)
        .eq("therapist_id", therapistId);
      setBusy(false);
      if (error) return toast.error(error.message);
      setIsFav(false);
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ customer_id: profileId, therapist_id: therapistId });
      setBusy(false);
      if (error) return toast.error(error.message);
      setIsFav(true);
      toast.success("Added to favorites ♡");
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
      className="flex size-10 items-center justify-center rounded-full border bg-white text-xl transition hover:border-[var(--gold-400)]"
      style={{ color: isFav ? "#A6433C" : "var(--ink-400)" }}
    >
      {isFav ? "♥" : "♡"}
    </button>
  );
}
