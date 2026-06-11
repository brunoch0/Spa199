import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NoticeForm, NoticeToggle } from "./notice-form";

export default async function AdminNoticesPage() {
  const supabase = await createClient();
  const { data: notices } = await supabase
    .from("notices")
    .select("*")
    .order("publish_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Notices & promotions</h1>
      <NoticeForm />
      {notices?.map((n) => (
        <Card key={n.id}>
          <CardContent className="flex items-start justify-between gap-4 p-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={n.type === "promotion" ? "default" : "secondary"} className={n.type === "promotion" ? "bg-emerald-600" : ""}>
                  {n.type}
                </Badge>
                <p className="font-medium">{n.title}</p>
              </div>
              <p className="mt-1 text-sm text-neutral-600">{n.body}</p>
              <p className="mt-1 text-xs text-neutral-400">
                {new Date(n.publish_at).toLocaleString()}
              </p>
            </div>
            <NoticeToggle noticeId={n.id} isPublished={n.is_published} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
