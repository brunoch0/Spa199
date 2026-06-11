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

const ALL = "__all__";

function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== ALL) params.set(key, value);
    else params.delete(key);
    router.push(`/search?${params.toString()}`);
  }

  const hasFilters = ["service", "area", "maxPrice"].some((k) => searchParams.get(k));

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
          <SelectItem value={ALL}>All treatments</SelectItem>
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
          <SelectItem value={ALL}>All areas</SelectItem>
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
          <SelectItem value={ALL}>Any price</SelectItem>
          {[199, 250, 300, 400].map((p) => (
            <SelectItem key={p} value={String(p)}>
              Up to AED {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push("/search")}>
          Clear
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
