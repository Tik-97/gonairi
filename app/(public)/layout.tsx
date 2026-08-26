import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { LanguageSwitcher } from "@/components/dashboard/language-switcher";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { locale, dict } = await getDictionary();

  return (
    <div className="flex flex-1 flex-col bg-cream text-espresso">
      <header className="border-b border-terracotta/15">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/">
            <Wordmark className="font-serif text-xl font-semibold tracking-tight" />
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/tours" className="text-espresso/70 hover:text-espresso">
              {dict.publicLayout.browseTours}
            </Link>
            <Link href="/login" className="text-espresso/70 hover:text-espresso">
              {dict.publicLayout.agencyLogin}
            </Link>
            <LanguageSwitcher locale={locale} dict={dict.languageSwitcher} />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">{children}</main>
      <footer className="border-t border-terracotta/15 px-6 py-8 text-center text-sm text-espresso/60">
        {dict.publicLayout.footer}
      </footer>
    </div>
  );
}
