import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TherapistCard } from "@/components/therapist-card";
import { Button } from "@/components/ui/button";
import { SERVICE_TYPES, DUBAI_AREAS } from "@/lib/constants";
import { areaFromSlug, areaSlug as toSlug } from "@/lib/seo";
import type { Therapist } from "@/lib/types";

export const revalidate = 3600;

export async function generateStaticParams() {
  return DUBAI_AREAS.map((a) => ({ areaSlug: toSlug(a) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ areaSlug: string }>;
}): Promise<Metadata> {
  const { areaSlug } = await params;
  const area = areaFromSlug(areaSlug);
  if (!area) return {};
  return {
    title: `Massage in ${area}, Dubai — at your hotel or home | SPA199`,
    description: `Book certified massage therapists in ${area}, Dubai. Swedish, deep tissue, Thai and more — delivered to your hotel or home from AED 199. Free cancellation up to 48h.`,
    alternates: { canonical: `https://spa199.vercel.app/massage/${areaSlug}` },
  };
}

export default async function AreaLandingPage({
  params,
}: {
  params: Promise<{ areaSlug: string }>;
}) {
  const { areaSlug } = await params;
  const area = areaFromSlug(areaSlug);
  if (!area) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("therapists")
    .select("*, profile:profiles!therapists_id_fkey(*), services:therapist_services(*)")
    .eq("is_approved", true)
    .contains("service_areas", [area])
    .order("rating_avg", { ascending: false });

  const therapists = (data as Therapist[] | null) ?? [];

  return (
    <div className="space-y-8">
      <section
        className="relative overflow-hidden rounded-3xl"
        style={{ background: "var(--onyx-950)" }}
      >
        <div className="bg-mashrabiya absolute inset-0 opacity-50" />
        <div className="relative px-6 py-10 sm:px-10">
          <p className="t-overline" style={{ color: "var(--gold-300)" }}>
            On-demand · {area}
          </p>
          <h1
            className="font-display mt-3 max-w-2xl text-3xl sm:text-4xl"
            style={{ color: "var(--ivory)", fontWeight: 600 }}
          >
            In-room massage in <em style={{ color: "var(--gold-300)" }}>{area}</em>
          </h1>
          <p className="mt-3 max-w-md text-[15px]" style={{ color: "var(--text-on-dark-muted)" }}>
            Certified therapists come to your hotel or home in {area} — from AED 199,
            free cancellation up to 48 hours.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href={`/search?area=${encodeURIComponent(area)}`}>
              Book in {area}
            </Link>
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl">
          {therapists.length > 0
            ? `Therapists serving ${area}`
            : `Therapists in ${area} — coming soon`}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {therapists.map((t) => (
            <TherapistCard key={t.id} therapist={t} />
          ))}
        </div>
        {therapists.length === 0 && (
          <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
            We&apos;re onboarding therapists for this area.{" "}
            <Link href="/search" className="font-medium text-[var(--text-gold)] hover:underline">
              Browse all of Dubai →
            </Link>
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-2xl">Popular treatments in {area}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SERVICE_TYPES.slice(0, 8).map((s) => (
            <Link
              key={s.value}
              href={`/search?service=${s.value}&area=${encodeURIComponent(area)}`}
              className="rounded-xl border bg-card p-3 text-center text-sm font-medium transition hover:border-[var(--gold-400)]"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-2xl">More areas</h2>
        <div className="flex flex-wrap gap-2">
          {DUBAI_AREAS.filter((a) => a !== area).map((a) => (
            <Link
              key={a}
              href={`/massage/${toSlug(a)}`}
              className="rounded-full border bg-card px-3 py-1.5 text-sm transition hover:border-[var(--gold-400)]"
            >
              {a}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
