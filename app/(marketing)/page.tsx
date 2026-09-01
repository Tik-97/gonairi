import { Wallet, Globe, ShieldCheck } from "lucide-react";
import { TryDemoDialog } from "@/components/marketing/try-demo-dialog";
import { PricingSection } from "@/components/marketing/pricing-section";
import { BrowserFrame } from "@/components/marketing/browser-frame";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function MarketingHomePage() {
  const { dict } = await getDictionary();
  const m = dict.marketing;

  const featureRows = [
    { ...m.featureRows.tours, image: "/images/marketing/tours-catalogue.webp", reverse: false },
    { ...m.featureRows.departures, image: "/images/marketing/departures-scheduling.webp", reverse: true },
    { ...m.featureRows.bookings, image: "/images/marketing/bookings-crm.webp", reverse: false },
    { ...m.featureRows.fleet, image: "/images/marketing/fleet-vehicles.webp", reverse: true },
  ];

  const moreFeatures = [
    { icon: Wallet, ...m.moreFeatures.financial },
    { icon: Globe, ...m.moreFeatures.bilingual },
    { icon: ShieldCheck, ...m.moreFeatures.permissions },
  ];

  return (
    <>
      <section className="relative overflow-hidden px-6 pt-16 pb-20 sm:pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-0 h-[420px] w-[420px] rounded-full bg-terracotta/15 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-6">
            <h1 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-espresso sm:text-5xl lg:text-[3.25rem]">
              {m.home.heroTitle}
            </h1>
            <p className="max-w-lg text-lg text-espresso/70">{m.home.heroSubtitle}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <TryDemoDialog
                dict={m.tryDemoDialog}
                trigger={
                  <button className="rounded-full bg-terracotta px-7 py-3.5 text-base font-medium text-white shadow-sm transition-colors hover:bg-terracotta-700">
                    {m.header.tryDemo}
                  </button>
                }
              />
              <a
                href="#pricing"
                className="rounded-full border border-terracotta/25 px-7 py-3.5 text-base font-medium text-espresso transition-colors hover:bg-cream-100"
              >
                {m.home.seePricing}
              </a>
            </div>
          </div>

          <BrowserFrame
            src="/images/marketing/dashboard-overview.webp"
            alt="GoNairi dashboard showing an agency's tours, bookings, and upcoming departures"
            width={1600}
            height={1000}
            priority
            className="lg:translate-y-4"
          />
        </div>
      </section>

      <section id="solutions" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold text-espresso sm:text-4xl">{m.home.solutionsTitle}</h2>
          <p className="mt-3 text-espresso/70">{m.home.solutionsSubtitle}</p>
        </div>

        <div className="mt-16 flex flex-col gap-20">
          {featureRows.map(({ title, description, image, reverse }) => {
            const text = (
              <div className="flex flex-col items-start gap-3">
                <h3 className="font-serif text-2xl font-medium text-espresso">{title}</h3>
                <p className="text-espresso/70">{description}</p>
              </div>
            );
            const screenshot = <BrowserFrame src={image} alt={title} width={1600} height={1000} />;
            return (
              <div key={title} className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
                {reverse ? screenshot : text}
                {reverse ? text : screenshot}
              </div>
            );
          })}
        </div>

        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {moreFeatures.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-2xl border border-terracotta/15 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-terracotta/12">
                <Icon className="h-5 w-5 text-terracotta-700" strokeWidth={1.75} />
              </span>
              <h3 className="font-serif text-lg font-medium text-espresso">{title}</h3>
              <p className="text-sm text-espresso/70">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <PricingSection dict={m} />

      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="flex flex-col items-center gap-5 rounded-3xl bg-terracotta/10 px-8 py-14 text-center">
          <h2 className="font-serif text-3xl font-semibold text-espresso">{m.home.ctaTitle}</h2>
          <p className="max-w-xl text-espresso/70">{m.home.ctaSubtitle}</p>
          <TryDemoDialog
            dict={m.tryDemoDialog}
            trigger={
              <button className="rounded-full bg-terracotta px-7 py-3.5 text-base font-medium text-white shadow-sm transition-colors hover:bg-terracotta-700">
                {m.header.tryDemo}
              </button>
            }
          />
        </div>
      </section>
    </>
  );
}
