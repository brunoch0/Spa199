import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhotoModerateButtons } from "./photo-moderate-buttons";

export default async function AdminPhotosPage() {
  const supabase = await createClient();
  const { data: pending } = await supabase
    .from("media_reviews")
    .select(
      "*, therapist:therapists(photos, profile:profiles(full_name)), service:therapist_services(service_type, duration_min)"
    )
    .eq("status", "pending")
    .order("created_at");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Photo review queue</h1>
      <p className="text-sm text-muted-foreground">
        Approve only treatment / workspace / professional photos. Reject suggestive or
        off-policy images — the therapist is notified automatically.
      </p>

      {(!pending || pending.length === 0) && (
        <Card>
          <CardContent className="p-10 text-center text-neutral-500">
            All clear — no photos waiting for review. ✨
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pending?.map((m) => (
          <Card key={m.id}>
            <CardContent className="space-y-3 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt="Photo pending review"
                className="aspect-square w-full rounded-lg border object-cover"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{m.therapist?.profile?.full_name}</span>
                <Badge variant="secondary">
                  {m.kind === "service" && m.service
                    ? `menu · ${m.service.service_type}`
                    : m.kind}
                </Badge>
              </div>
              <PhotoModerateButtons review={JSON.parse(JSON.stringify(m))} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
