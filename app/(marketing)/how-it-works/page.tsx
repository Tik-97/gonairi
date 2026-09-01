import { Building2, Map, CalendarClock, CreditCard, Users2 } from "lucide-react";
import { TryDemoDialog } from "@/components/marketing/try-demo-dialog";
import { BrowserFrame } from "@/components/marketing/browser-frame";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function HowItWorksPage() {
  const { dict } = await getDictionary();
  const m = dict.marketing;
  const t = m.howItWorksPage;

  const steps = [
    { icon: Building2, ...t.steps.setupAgency },
    { icon: Map, ...t.steps.addTours },
    { icon: CalendarClock, ...t.steps.scheduleDepartures },
    { icon: CreditCard, ...t.steps.takeBookings },
    { icon: Users2, ...t.steps.runAsTeam },
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-3xl font-semibold text-espresso sm:text-4xl">{t.title}</h1>
        <p className="mt-3 text-espresso/70">{t.subtitle}</p>
      </div>

      <div className="mx-auto mt-16 flex max-w-3xl flex-col gap-10">
        {steps.map(({ icon: Icon, title, description }, index) => (
          <div key={title} className="flex gap-5">
            <div className="flex flex-col items-center">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-terracotta/12">
                <Icon className="h-5 w-5 text-terracotta-700" strokeWidth={1.75} />
              </span>
              {index < steps.length - 1 && <span className="mt-2 w-px flex-1 bg-terracotta/15" />}
            </div>
            <div className="pb-2">
              <p className="text-xs font-semibold tracking-[0.16em] text-terracotta-700 uppercase">{t.stepLabel} {index + 1}</p>
              <h2 className="mt-1 font-serif text-xl font-medium text-espresso">{title}</h2>
              <p className="mt-2 text-espresso/70">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-3xl">
        <BrowserFrame
          src="/images/marketing/dashboard-overview.webp"
          alt="GoNairi dashboard showing an agency's tours, bookings, and upcoming departures"
          width={1600}
          height={1000}
        />
      </div>

      <div className="mx-auto mt-16 flex max-w-xl flex-col items-center gap-5 text-center">
        <h2 className="font-serif text-2xl font-semibold text-espresso">{t.ctaTitle}</h2>
        <p className="text-espresso/70">{t.ctaSubtitle}</p>
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
  );
}
