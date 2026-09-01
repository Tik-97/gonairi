"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { TryDemoDialog } from "@/components/marketing/try-demo-dialog";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

export function PricingSection({ dict }: { dict: Dictionary["marketing"] }) {
  const [annual, setAnnual] = useState(false);
  const t = dict.pricing;
  const freeFeatures = Object.values(t.freeFeatures);
  const premiumFeatures = Object.values(t.premiumFeatures);

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-serif text-3xl font-semibold text-espresso sm:text-4xl">{t.title}</h2>
        <p className="mt-3 text-espresso/70">{t.subtitle}</p>
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        <span className={cn("text-sm font-medium", !annual ? "text-espresso" : "text-espresso/50")}>{t.monthly}</span>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          onClick={() => setAnnual((v) => !v)}
          className="relative h-6 w-11 shrink-0 rounded-full bg-terracotta/25 p-0 transition-colors"
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-terracotta shadow-sm transition-transform",
              annual ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
        <span className={cn("text-sm font-medium", annual ? "text-espresso" : "text-espresso/50")}>
          {t.annual} <span className="text-terracotta-700">{t.annualNote}</span>
        </span>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-6 rounded-2xl border border-terracotta/15 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div>
            <h3 className="font-serif text-xl font-semibold text-espresso">{t.free.title}</h3>
            <p className="mt-1 text-sm text-espresso/60">{t.free.subtitle}</p>
          </div>
          <p className="font-serif text-4xl font-semibold text-espresso">
            $0<span className="text-base font-normal text-espresso/50"> {t.perMonth}</span>
          </p>
          <TryDemoDialog
            dict={dict.tryDemoDialog}
            trigger={
              <button className="rounded-full border border-terracotta/30 px-6 py-2.5 text-sm font-medium text-terracotta-700 transition-colors hover:bg-terracotta/10">
                {t.free.cta}
              </button>
            }
          />
          <ul className="flex flex-col gap-3 text-sm text-espresso/80">
            {freeFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-terracotta-700" strokeWidth={2} />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-6 rounded-2xl border-2 border-terracotta bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
          <div>
            <h3 className="font-serif text-xl font-semibold text-espresso">{t.premium.title}</h3>
            <p className="mt-1 text-sm text-espresso/60">{t.premium.subtitle}</p>
          </div>
          <p className="font-serif text-4xl font-semibold text-espresso">
            ${annual ? "700" : "70"}
            <span className="text-base font-normal text-espresso/50"> {annual ? t.perYear : t.perMonth}</span>
          </p>
          <TryDemoDialog
            dict={dict.tryDemoDialog}
            trigger={
              <button className="rounded-full bg-terracotta px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-terracotta-700">
                {t.premium.cta}
              </button>
            }
          />
          <ul className="flex flex-col gap-3 text-sm text-espresso/80">
            {premiumFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-terracotta-700" strokeWidth={2} />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
