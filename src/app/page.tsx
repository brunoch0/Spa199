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
    <div className="space-y-12">
      {/* Hero — gold foil on onyx with mashrabiya lattice */}
      <section
        className="relative overflow-hidden rounded-3xl"
        style={{ background: "var(--onyx-950)", boxShadow: "var(--shadow-dark)" }}
      >
        <div className="bg-mashrabiya absolute inset-0 opacity-50" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 85% 10%, rgba(192,151,75,0.22), transparent 60%)",
          }}
        />
        <div className="relative px-6 py-12 sm:px-12 sm:py-14">
          <p className="t-overline" style={{ color: "var(--gold-300)" }}>
            On-demand · Dubai
          </p>
          <h1
            className="font-display mt-4 max-w-xl text-4xl leading-[1.05] sm:text-[3.5rem]"
            style={{ color: "var(--ivory)", fontWeight: 600 }}
          >
            The spa, brought to
            <br />
            <em style={{ color: "var(--gold-300)" }}>your door</em>.
          </h1>
          <p
            className="mt-5 max-w-md text-[17px] leading-relaxed"
            style={{ color: "var(--text-on-dark-muted)" }}
          >
            Certified therapists, premium oils and warmed linens — at your hotel
            or home in 60 minutes. From AED 199.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="shadow-[var(--glow-gold-soft)]">
              <Link href="/search">{dict.bookNow}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-[var(--border-on-dark)] bg-transparent text-[var(--gold-200)] hover:border-[var(--gold-300)] hover:bg-[rgba(220,190,124,0.12)] hover:text-[var(--gold-100)]"
            >
              <Link href="/signup?role=therapist">{dict.joinAsTherapist}</Link>
            </Button>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-2">
            {["Vetted & insured", "Arrives in 60 min", "5-star rated"].map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-2 text-[13px] font-medium"
                style={{ color: "var(--gold-200)" }}
              >
                <span style={{ color: "var(--gold-400)" }}>✦</span>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Notices */}
      {notices && notices.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2">
          {notices.map((n) => (
            <Card key={n.id} className="border-[var(--gold-200)] bg-[var(--gold-50)]">
              <CardContent className="flex items-start gap-3 p-4">
                <Badge variant={n.type === "promotion" ? "default" : "secondary"}>
                  {n.type === "promotion" ? "Promo" : "Notice"}
                </Badge>
                <div>
                  <p className="font-medium">{n.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {/* Treatments */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-3xl">{dict.browseByTreatment}</h2>
          <Link
            href="/search"
            className="text-sm font-medium text-[var(--text-gold)] hover:underline"
          >
            {dict.viewAll}
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {SERVICE_TYPES.map((s) => (
            <Link
              key={s.value}
              href={`/search?service=${s.value}`}
              className="rounded-xl border bg-card p-3 text-center text-sm font-medium transition hover:border-[var(--gold-400)] hover:shadow-sm"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Top therapists */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-3xl">{dict.topRatedTherapists}</h2>
          <Link
            href="/search"
            className="text-sm font-medium text-[var(--text-gold)] hover:underline"
          >
            {dict.viewAll}
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {(therapists as Therapist[] | null)?.map((t) => (
            <TherapistCard key={t.id} therapist={t} />
          ))}
        </div>
      </section>

      {/* How it works — three steps to stillness */}
      <section className="grid overflow-hidden rounded-3xl border bg-card sm:grid-cols-[1.1fr_1fr]">
        <div className="px-8 py-10 sm:px-11">
          <p className="t-overline">{dict.howItWorks}</p>
          <h2 className="mt-2 mb-7 text-3xl">Three steps to stillness</h2>
          {[
            ["Choose", "Pick a treatment and a therapist you trust — read real guest reviews."],
            ["Schedule", "Select a time and share your address. Free cancellation up to 48 hours."],
            ["Unwind", "Your therapist arrives fully equipped. You simply relax."],
          ].map(([title, desc], i) => (
            <div key={title} className="mb-5 flex gap-4">
              <span
                className="font-display inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[22px]"
                style={{
                  color: "var(--gold-500)",
                  border: "1.5px solid var(--border-gold)",
                  fontWeight: 600,
                }}
              >
                {i + 1}
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div
          className="min-h-[280px] bg-cover bg-center"
          style={{ backgroundImage: "url(/brand/photo-treatment-room.jpeg)" }}
        />
      </section>
    </div>
  );
}
