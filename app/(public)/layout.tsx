import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-cream text-espresso">
      <header className="border-b border-terracotta/15">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/">
            <Wordmark className="font-serif text-xl font-semibold tracking-tight" />
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/tours" className="text-espresso/70 hover:text-espresso">
              Browse tours
            </Link>
            <Link href="/login" className="text-espresso/70 hover:text-espresso">
              Agency login
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-terracotta px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-terracotta-700"
            >
              List your agency
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">{children}</main>
      <footer className="border-t border-terracotta/15 px-6 py-8 text-center text-sm text-espresso/60">
        GoNairi — tour booking &amp; agency back-office for Armenia
      </footer>
    </div>
  );
}
