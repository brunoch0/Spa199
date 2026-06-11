import { createClient } from "@/lib/supabase/server";
import { TherapistCard } from "@/components/therapist-card";
import { SearchFilters } from "@/components/search-filters";
import type { Therapist } from "@/lib/types";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; area?: string; maxPrice?: string }>;
}) {
  const { service, area, maxPrice } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("therapists")
    .select("*, profile:profiles(*), services:therapist_services(*)")
    .eq("is_approved", true)
    .order("rating_avg", { ascending: false });

  if (service) query = query.contains("specialties", [service]);
  if (area) query = query.contains("service_areas", [area]);

  const { data } = await query;
  let therapists = (data as Therapist[] | null) ?? [];

  if (maxPrice) {
    const cap = Number(maxPrice);
    therapists = therapists.filter((t) =>
      t.services?.some((s) => Number(s.price_aed) <= cap)
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Find your therapist</h1>
      <SearchFilters />
      <p className="text-sm text-neutral-500">
        {therapists.length} therapist{therapists.length === 1 ? "" : "s"} available
        {area ? ` in ${area}` : " in Dubai"}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {therapists.map((t) => (
          <TherapistCard key={t.id} therapist={t} />
        ))}
      </div>
      {therapists.length === 0 && (
        <div className="rounded-xl border bg-white p-10 text-center text-neutral-500">
          No therapists match these filters. Try widening your search.
        </div>
      )}
    </div>
  );
}
