import type { Metadata } from "next";
import { Geist, Cormorant_Garamond } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Analytics } from "@/components/analytics";
import { I18nProvider } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://spa199.vercel.app"),
  title: {
    default: "SPA199 — On-demand massage in Dubai, at your door",
    template: "%s | SPA199",
  },
  description:
    "Certified therapists, premium oils and warmed linens — at your hotel or home in Dubai. From AED 199.",
  openGraph: {
    siteName: "SPA199",
    title: "SPA199 — On-demand massage in Dubai, at your door",
    description:
      "Certified therapists, premium oils and warmed linens — at your hotel or home in Dubai. From AED 199.",
    images: [{ url: "/brand/photo-treatment-room.jpeg", width: 1200, height: 800 }],
    locale: "en_AE",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body
        className={`${geist.variable} ${cormorant.variable} ${geist.className} antialiased flex min-h-screen flex-col bg-background`}
      >
        <I18nProvider locale={locale}>
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6">{children}</main>
          <SiteFooter />
          <Toaster position="top-center" />
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
