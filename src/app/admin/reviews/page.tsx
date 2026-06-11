import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReviewModerateButtons } from "./review-moderate-buttons";

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      "*, customer:profiles!reviews_customer_id_fkey(full_name), therapist:therapists(profile:profiles(full_name))"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reviews management</h1>
      {reviews?.map((r) => (
        <Card key={r.id}>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm">
                <span className="font-medium">{r.customer?.full_name}</span>
                <span className="text-neutral-400"> → </span>
                <span className="font-medium">{r.therapist?.profile?.full_name}</span>
                <span className="ml-2 text-[var(--gold-500)]">{"★".repeat(r.rating)}</span>
              </p>
              <Badge
                variant={r.status === "published" ? "outline" : r.status === "pending" ? "secondary" : "destructive"}
              >
                {r.status}
              </Badge>
            </div>
            <p className="text-sm text-neutral-700">{r.comment}</p>
            <ReviewModerateButtons reviewId={r.id} status={r.status} />
          </CardContent>
        </Card>
      ))}
      {(!reviews || reviews.length === 0) && (
        <Card>
          <CardContent className="p-10 text-center text-neutral-500">No reviews.</CardContent>
        </Card>
      )}
    </div>
  );
}
