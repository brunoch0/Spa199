import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { I18nProvider } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "spa199 — On-demand massage in Dubai",
  description:
    "Book certified massage therapists to your hotel or home in Dubai. From AED 199.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body className={`${geist.className} antialiased min-h-screen bg-neutral-50`}>
        <I18nProvider locale={locale}>
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6">{children}</main>
          <Toaster position="top-center" />
        </I18nProvider>
      </body>
    </html>
  );
}
