import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getServerDict } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TherapistCard } from "@/components/therapist-card";
import { SERVICE_TYPES } from "@/lib/constants";
import type { Therapist } from "@/lib/types";

export default async function HomePage() {
  const [supabase, { dict }] = await Promise.all([createClient(), getServerDict()]);

  const [{ data: therapists }, { data: notices }] = await Promise.all([
    supabase
      .from("therapists")
      .select("*, profile:profiles(*), services:therapist_services(*)")
      .eq("is_approved", true)
      .order("rating_avg", { ascending: false })
      .limit(4),
    supabase
      .from("notices")
      .select("*")
      .eq("is_published", true)
      .order("publish_at", { ascending: false })
      .limit(2),
  ]);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 px-6 py-12 text-white sm:px-10">
        <h1 className="max-w-xl text-3xl font-bold leading-tight sm:text-4xl">
          {dict.heroTitle1}
          <br />
          {dict.heroTitle2}
        </h1>
        <p className="mt-3 max-w-md text-emerald-50">{dict.heroSubtitle}</p>
        <div className="mt-6 flex gap-3">
          <Button asChild size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50">
            <Link href="/search">{dict.bookNow}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
            <Link href="/signup?role=therapist">{dict.joinAsTherapist}</Link>
          </Button>
        </div>
      </section>

      {/* Notices */}
      {notices && notices.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2">
          {notices.map((n) => (
            <Card key={n.id} className="border-emerald-100 bg-emerald-50/50">
              <CardContent className="flex items-start gap-3 p-4">
                <Badge variant={n.type === "promotion" ? "default" : "secondary"} className={n.type === "promotion" ? "bg-emerald-600" : ""}>
                  {n.type === "promotion" ? "Promo" : "Notice"}
                </Badge>
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="mt-1 text-sm text-neutral-600">{n.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {/* Service types */}
      <section>
        <h2 className="mb-3 text-xl font-semibold">{dict.browseByTreatment}</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {SERVICE_TYPES.map((s) => (
            <Link
              key={s.value}
              href={`/search?service=${s.value}`}
              className="rounded-xl border bg-white p-3 text-center text-sm font-medium transition hover:border-emerald-400 hover:shadow-sm"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Top therapists */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{dict.topRatedTherapists}</h2>
          <Button asChild variant="link" className="text-emerald-700">
            <Link href="/search">{dict.viewAll}</Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {(therapists as Therapist[] | null)?.map((t) => (
            <TherapistCard key={t.id} therapist={t} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-2xl border bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">{dict.howItWorks}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            [dict.step1Title, dict.step1Desc],
            [dict.step2Title, dict.step2Desc],
            [dict.step3Title, dict.step3Desc],
          ].map(([title, desc]) => (
            <div key={title}>
              <p className="font-semibold text-emerald-700">{title}</p>
              <p className="mt-1 text-sm text-neutral-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
