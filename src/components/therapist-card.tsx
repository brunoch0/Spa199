import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { serviceLabel, formatAED } from "@/lib/constants";
import type { Therapist } from "@/lib/types";

export function TherapistCard({ therapist }: { therapist: Therapist }) {
  const minPrice = therapist.services?.length
    ? Math.min(...therapist.services.map((s) => Number(s.price_aed)))
    : null;

  return (
    <Link href={`/therapists/${therapist.id}`}>
      <Card className="h-full transition hover:border-emerald-400 hover:shadow-md">
        <CardContent className="flex gap-4 p-4">
          <Avatar className="size-16 shrink-0">
            <AvatarImage src={therapist.profile?.avatar_url ?? undefined} />
            <AvatarFallback>{therapist.profile?.full_name?.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-semibold">{therapist.profile?.full_name}</p>
              <span className="shrink-0 text-sm font-medium text-amber-600">
                ★ {Number(therapist.rating_avg).toFixed(1)}
                <span className="text-neutral-400"> ({therapist.rating_count})</span>
              </span>
            </div>
            <p className="text-sm text-neutral-500">
              {therapist.base_area} · {therapist.experience_years} yrs
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {therapist.specialties.slice(0, 3).map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {serviceLabel(s)}
                </Badge>
              ))}
            </div>
            {minPrice !== null && (
              <p className="mt-2 text-sm">
                from <span className="font-semibold text-emerald-700">{formatAED(minPrice)}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
