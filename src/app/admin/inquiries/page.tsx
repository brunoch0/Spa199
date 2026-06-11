import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InquiryReplyForm } from "./inquiry-reply-form";

export default async function AdminInquiriesPage() {
  const supabase = await createClient();
  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("*, reporter:profiles!inquiries_reporter_id_fkey(full_name, role)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inquiries & reports</h1>
      {inquiries?.map((q) => (
        <Card key={q.id}>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {q.type === "report" ? "🚩" : "💬"} {q.reason}
                <span className="ml-2 font-normal text-neutral-500">
                  by {q.reporter?.full_name} ({q.reporter?.role})
                </span>
              </p>
              <Badge variant={q.status === "resolved" ? "outline" : "secondary"}>
                {q.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-sm text-neutral-700">{q.detail}</p>
            {q.admin_reply && (
              <p className="rounded bg-emerald-50 p-2 text-sm text-emerald-900">
                <span className="font-medium">Reply:</span> {q.admin_reply}
              </p>
            )}
            {q.status !== "resolved" && <InquiryReplyForm inquiryId={q.id} />}
          </CardContent>
        </Card>
      ))}
      {(!inquiries || inquiries.length === 0) && (
        <Card>
          <CardContent className="p-10 text-center text-neutral-500">
            No inquiries yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
