import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { TherapistCard } from "@/components/therapist-card";
import type { Therapist } from "@/lib/types";

export default async function FavoritesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/favorites");

  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select("therapist:therapists(*, profile:profiles!therapists_id_fkey(*), services:therapist_services(*))")
    .eq("customer_id", profile.id)
    .order("created_at", { ascending: false });

  const therapists = (data ?? [])
    .map((f) => f.therapist as unknown as Therapist)
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My favorites ♡</h1>
      {therapists.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-neutral-500">
            No favorites yet — tap ♡ on a therapist profile to save them here.{" "}
            <Link href="/search" className="font-medium text-[var(--text-gold)] hover:underline">
              Find a therapist →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {therapists.map((t) => (
            <TherapistCard key={t.id} therapist={t} />
          ))}
        </div>
      )}
    </div>
  );
}
