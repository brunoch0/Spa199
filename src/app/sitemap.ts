import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { DUBAI_AREAS } from "@/lib/constants";
import { areaSlug } from "@/lib/seo";

const BASE = "https://spa199.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: therapists } = await supabase
    .from("therapists")
    .select("id")
    .eq("is_approved", true);

  return [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/search`, changeFrequency: "daily", priority: 0.9 },
    ...DUBAI_AREAS.map((a) => ({
      url: `${BASE}/massage/${areaSlug(a)}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...(therapists ?? []).map((t) => ({
      url: `${BASE}/therapists/${t.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    { url: `${BASE}/terms`, changeFrequency: "yearly" as const, priority: 0.2 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly" as const, priority: 0.2 },
    { url: `${BASE}/refund-policy`, changeFrequency: "yearly" as const, priority: 0.2 },
  ];
}
