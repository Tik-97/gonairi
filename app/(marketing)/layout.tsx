import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { locale, dict } = await getDictionary();
  const m = dict.marketing;

  return (
    <div className="flex flex-1 flex-col bg-cream text-espresso">
      <MarketingHeader locale={locale} dict={dict} />
      {children}
      <footer className="border-t border-terracotta/15 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/">
              <Wordmark className="font-serif text-lg font-semibold tracking-tight" />
            </Link>
            <nav className="flex flex-wrap items-center gap-5 text-sm text-espresso/70">
              <Link href="/how-it-works" className="hover:text-espresso">{m.header.howItWorks}</Link>
              <Link href="/#solutions" className="hover:text-espresso">{m.header.solutions}</Link>
              <Link href="/#pricing" className="hover:text-espresso">{m.header.pricing}</Link>
              <Link href="/contact-us" className="hover:text-espresso">{m.header.contact}</Link>
              <a href="https://crm.gonairi.com/login" className="hover:text-espresso">{m.header.login}</a>
            </nav>
          </div>
          <div className="flex flex-col gap-3 border-t border-terracotta/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-espresso/50">© {new Date().getFullYear()} GoNairi. {m.footer.rightsReservedSuffix}</p>
            <nav className="flex flex-wrap items-center gap-5 text-sm text-espresso/50">
              <Link href="/privacy-policy" className="hover:text-espresso">{dict.marketing.privacyPolicyPage.title}</Link>
              <Link href="/terms-of-service" className="hover:text-espresso">{dict.marketing.termsOfServicePage.title}</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
