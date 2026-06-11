import { createClient } from "@/lib/supabase/server";
import { getServerDict } from "@/lib/i18n/server";
import { SearchFilters } from "@/components/search-filters";
import { SearchResults } from "@/components/search-results";
import type { Therapist } from "@/lib/types";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; area?: string; maxPrice?: string }>;
}) {
  const { service, area, maxPrice } = await searchParams;
  const [supabase, { dict }] = await Promise.all([createClient(), getServerDict()]);

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
      <h1 className="text-2xl font-bold">{dict.findYourTherapist}</h1>
      <SearchFilters />
      <SearchResults
        therapists={JSON.parse(JSON.stringify(therapists))}
        area={area}
      />
    </div>
  );
}
