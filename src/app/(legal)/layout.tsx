export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl space-y-6 rounded-2xl border bg-card px-6 py-10 sm:px-10 [&_h1]:text-3xl [&_h2]:mt-8 [&_h2]:text-xl [&_p]:mt-2 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-muted-foreground [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:ps-5">
      {children}
    </article>
  );
}
