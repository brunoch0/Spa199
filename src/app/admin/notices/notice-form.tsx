"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function NoticeForm() {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("notice");
  const [busy, setBusy] = useState(false);

  async function publish() {
    setBusy(true);
    const { error } = await supabase.from("notices").insert({ title, body, type });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Published");
    setTitle("");
    setBody("");
    router.refresh();
  }

  return (
    <Card className="border-dashed">
      <CardContent className="space-y-3 p-4">
        <div className="flex gap-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="notice">Notice</SelectItem>
              <SelectItem value="promotion">Promotion</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="flex-1"
          />
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Content shown on the home page…"
          rows={2}
        />
        <Button
          disabled={busy || !title.trim()}
          onClick={publish}
         
        >
          {busy ? "Publishing…" : "Publish"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function NoticeToggle({
  noticeId,
  isPublished,
}: {
  noticeId: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const { error } = await supabase
      .from("notices")
      .update({ is_published: !isPublished })
      .eq("id", noticeId);
    setBusy(false);
    if (error) return toast.error(error.message);
    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" disabled={busy} onClick={toggle}>
      {isPublished ? "Unpublish" : "Publish"}
    </Button>
  );
}
