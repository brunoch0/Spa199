import { createClient } from "@/lib/supabase/server";
import { getServerDict } from "@/lib/i18n/server";
import { SearchFilters } from "@/components/search-filters";
import { SearchResults } from "@/components/search-results";
import { isAvailableAt } from "@/lib/slots";
import type { AvailabilitySlot, Therapist } from "@/lib/types";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    service?: string;
    area?: string;
    maxPrice?: string;
    date?: string;
    time?: string;
  }>;
}) {
  const { service, area, maxPrice, date, time } = await searchParams;
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

  // availability filter: keep therapists who can host a 60-min session at date+time
  if (date && time && therapists.length > 0) {
    const ids = therapists.map((t) => t.id);
    const [{ data: avail }, { data: busy }, { data: exc }] = await Promise.all([
      supabase.from("availability_slots").select("*").in("therapist_id", ids),
      supabase.from("booked_slots").select("*").in("therapist_id", ids).eq("booking_date", date),
      supabase
        .from("availability_exceptions")
        .select("therapist_id, date")
        .in("therapist_id", ids)
        .eq("date", date)
        .eq("is_off", true),
    ]);

    // noon anchor keeps toISOString()/getDay() on the same calendar date in any TZ
    const target = new Date(`${date}T12:00:00`);
    therapists = therapists.filter((t) =>
      isAvailableAt(
        target,
        time,
        60,
        ((avail as AvailabilitySlot[]) ?? []).filter((a) => a.therapist_id === t.id),
        (busy ?? []).filter((b: { therapist_id: string }) => b.therapist_id === t.id),
        (exc ?? []).some((e: { therapist_id: string }) => e.therapist_id === t.id)
      )
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
