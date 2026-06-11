import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { serviceLabel, formatAED } from "@/lib/constants";
import { ReportReviewButton } from "@/components/report-review-button";
import { ZoomablePhoto, PhotoGrid } from "@/components/zoomable-photo";
import { FavoriteButton } from "@/components/favorite-button";
import type { Review, Therapist } from "@/lib/types";

export default async function TherapistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: t }, { data: reviews }] = await Promise.all([
    supabase
      .from("therapists")
      .select("*, profile:profiles(*), services:therapist_services(*)")
      .eq("id", id)
      .single(),
    supabase
      .from("reviews")
      .select("*, customer:profiles!reviews_customer_id_fkey(full_name, avatar_url)")
      .eq("therapist_id", id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!t) notFound();
  const therapist = t as Therapist;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          {therapist.profile?.avatar_url ? (
            <ZoomablePhoto
              url={therapist.profile.avatar_url}
              alt={therapist.profile.full_name}
              label={therapist.profile.full_name}
              className="size-24 rounded-full border object-cover"
            />
          ) : (
            <Avatar className="size-24">
              <AvatarFallback className="text-2xl">
                {therapist.profile?.full_name?.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{therapist.profile?.full_name}</h1>
            <p className="text-neutral-500">
              {therapist.base_area} · {therapist.experience_years} years experience
            </p>
            <p className="mt-1 font-medium text-[var(--gold-500)]">
              ★ {Number(therapist.rating_avg).toFixed(1)}{" "}
              <span className="font-normal text-neutral-400">
                ({therapist.rating_count} reviews)
              </span>
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {therapist.specialties.map((s) => (
                <Badge key={s} variant="secondary">
                  {serviceLabel(s)}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FavoriteButton therapistId={therapist.id} />
            <Button asChild size="lg">
              <Link href={`/book/${therapist.id}`}>Book now</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Gallery — click to enlarge */}
          {therapist.photos.length > 0 && (
            <PhotoGrid
              photos={therapist.photos.map((url, i) => ({
                url,
                label: `${therapist.profile?.full_name} · Gallery ${i + 1}`,
              }))}
              gridClassName="grid grid-cols-3 gap-2 sm:grid-cols-6"
              itemClassName="aspect-square w-full rounded-lg border object-cover"
            />
          )}

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-neutral-700">{therapist.bio}</p>
              {therapist.certifications.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-medium">Certifications</p>
                  {therapist.certifications.map((c) => (
                    <p key={c.name} className="text-sm text-neutral-600">
                      ✓ {c.name} — {c.issuer}
                    </p>
                  ))}
                </div>
              )}
              <div>
                <p className="mb-1 text-sm font-medium">Service areas</p>
                <div className="flex flex-wrap gap-1">
                  {therapist.service_areas.map((a) => (
                    <Badge key={a} variant="outline">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Reviews ({therapist.rating_count})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(reviews as (Review & { customer: { full_name: string; avatar_url: string | null } })[] | null)?.map(
                (r, i) => (
                  <div key={r.id}>
                    {i > 0 && <Separator className="mb-4" />}
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8">
                        <AvatarImage src={r.customer?.avatar_url ?? undefined} />
                        <AvatarFallback>{r.customer?.full_name?.slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{r.customer?.full_name}</p>
                        <p className="text-xs text-[var(--gold-500)]">
                          {"★".repeat(r.rating)}
                          <span className="text-neutral-300">{"★".repeat(5 - r.rating)}</span>
                        </p>
                      </div>
                      <span className="ms-auto flex items-center gap-2 text-xs text-neutral-400">
                        {new Date(r.created_at).toLocaleDateString()}
                        <ReportReviewButton reviewId={r.id} />
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-neutral-700">{r.comment}</p>
                    {r.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
              {(!reviews || reviews.length === 0) && (
                <p className="text-sm text-neutral-500">No reviews yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Services & prices */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Services & prices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {therapist.services?.sort((a, b) => Number(a.price_aed) - Number(b.price_aed)).map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3">
                {s.photo_url && (
                  <ZoomablePhoto
                    url={s.photo_url}
                    alt={serviceLabel(s.service_type)}
                    label={`${serviceLabel(s.service_type)} · ${s.duration_min} min`}
                    className="size-12 shrink-0 rounded-lg border object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{serviceLabel(s.service_type)}</p>
                  <p className="text-sm text-neutral-500">{s.duration_min} min</p>
                </div>
                <p className="font-semibold text-[var(--text-gold)]">{formatAED(s.price_aed)}</p>
              </div>
            ))}
            <Button asChild className="w-full">
              <Link href={`/book/${therapist.id}`}>Book now</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
