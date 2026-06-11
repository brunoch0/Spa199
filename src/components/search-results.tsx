"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { TherapistCard } from "@/components/therapist-card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import type { Therapist } from "@/lib/types";

const TherapistMap = dynamic(() => import("@/components/therapist-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] items-center justify-center rounded-xl border bg-white text-neutral-400">
      Loading map…
    </div>
  ),
});

export function SearchResults({
  therapists,
  area,
}: {
  therapists: Therapist[];
  area?: string;
}) {
  const { dict } = useI18n();
  const [view, setView] = useState<"list" | "map">("list");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {therapists.length} {dict.therapistsAvailable} {area ? `· ${area}` : `· ${dict.inDubai}`}
        </p>
        <div className="flex rounded-lg border bg-white p-0.5">
          <Button
            size="sm"
            variant={view === "list" ? "default" : "ghost"}
            className={view === "list" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            onClick={() => setView("list")}
          >
            {dict.listView}
          </Button>
          <Button
            size="sm"
            variant={view === "map" ? "default" : "ghost"}
            className={view === "map" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            onClick={() => setView("map")}
          >
            {dict.mapView}
          </Button>
        </div>
      </div>

      {view === "map" ? (
        <TherapistMap therapists={therapists} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {therapists.map((t) => (
            <TherapistCard key={t.id} therapist={t} />
          ))}
        </div>
      )}

      {therapists.length === 0 && (
        <div className="rounded-xl border bg-white p-10 text-center text-neutral-500">
          {dict.noTherapistsMatch}
        </div>
      )}
    </div>
  );
}
