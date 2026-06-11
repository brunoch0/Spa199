import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "spa199 — On-demand massage in Dubai",
  description:
    "Book certified massage therapists to your hotel or home in Dubai. From AED 199.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.className} antialiased min-h-screen bg-neutral-50`}>
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6">{children}</main>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
