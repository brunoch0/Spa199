import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/therapist", "/account", "/bookings", "/notifications", "/book"],
    },
    sitemap: "https://spa199.vercel.app/sitemap.xml",
  };
}
