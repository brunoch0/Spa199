import Link from "next/link";

export function SiteFooter() {
  return (
    <footer
      className="mt-auto border-t"
      style={{ background: "var(--onyx-950)", borderColor: "var(--border-on-dark)" }}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between">
        <div className="flex items-baseline gap-2">
          <span
            className="font-display leading-none"
            style={{ color: "var(--gold-300)", fontSize: 20, fontWeight: 600 }}
          >
            199
          </span>
          <span
            className="uppercase"
            style={{ color: "var(--gold-200)", fontSize: 9, fontWeight: 500, letterSpacing: "0.34em" }}
          >
            Spa&nbsp;Dubai
          </span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs" style={{ color: "var(--text-on-dark-muted)" }}>
          <Link href="/terms" className="hover:text-[var(--gold-200)]">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-[var(--gold-200)]">Privacy Policy</Link>
          <Link href="/refund-policy" className="hover:text-[var(--gold-200)]">Cancellation & Refunds</Link>
          <a href="mailto:support@199spa.ae" className="hover:text-[var(--gold-200)]">support@199spa.ae</a>
        </nav>
        <p className="text-xs" style={{ color: "var(--text-on-dark-muted)" }}>
          © 2026 199 Spa Dubai
        </p>
      </div>
    </footer>
  );
}
