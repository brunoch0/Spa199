"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SERVICE_TYPES, DUBAI_AREAS } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

const ALL = "__all__";

function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dict } = useI18n();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== ALL) params.set(key, value);
    else params.delete(key);
    router.push(`/search?${params.toString()}`);
  }

  const hasFilters = ["service", "area", "maxPrice", "date", "time"].some((k) =>
    searchParams.get(k)
  );
  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const HOURS = Array.from({ length: 15 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={searchParams.get("service") ?? ALL}
        onValueChange={(v) => setParam("service", v)}
      >
        <SelectTrigger className="w-[160px] bg-white">
          <SelectValue placeholder="Treatment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{dict.allTreatments}</SelectItem>
          {SERVICE_TYPES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("area") ?? ALL}
        onValueChange={(v) => setParam("area", v)}
      >
        <SelectTrigger className="w-[170px] bg-white">
          <SelectValue placeholder="Area" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{dict.allAreas}</SelectItem>
          {DUBAI_AREAS.map((a) => (
            <SelectItem key={a} value={a}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("maxPrice") ?? ALL}
        onValueChange={(v) => setParam("maxPrice", v)}
      >
        <SelectTrigger className="w-[150px] bg-white">
          <SelectValue placeholder="Max price" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{dict.anyPrice}</SelectItem>
          {[199, 250, 300, 400].map((p) => (
            <SelectItem key={p} value={String(p)}>
              {dict.upTo} {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <input
        type="date"
        value={searchParams.get("date") ?? ""}
        min={today}
        max={maxDate}
        onChange={(e) => setParam("date", e.target.value)}
        aria-label={dict.dateFilter}
        className="h-9 rounded-md border bg-white px-2 text-sm"
      />

      <Select
        value={searchParams.get("time") ?? ALL}
        onValueChange={(v) => setParam("time", v)}
      >
        <SelectTrigger className="w-[120px] bg-white">
          <SelectValue placeholder={dict.timeFilter} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{dict.anyTime}</SelectItem>
          {HOURS.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push("/search")}>
          {dict.clear}
        </Button>
      )}
    </div>
  );
}

export function SearchFilters() {
  return (
    <Suspense>
      <Filters />
    </Suspense>
  );
}
