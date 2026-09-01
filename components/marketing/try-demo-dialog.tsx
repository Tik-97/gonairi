"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PhoneInput } from "@/components/phone-input";
import { cn } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

const EMPLOYEE_BUCKETS = ["< 5", "5 - 19", "20 - 49", "50 - 99", "> 100"];

export function TryDemoDialog({
  trigger,
  dict,
}: {
  trigger: React.ReactNode;
  dict: Dictionary["marketing"]["tryDemoDialog"];
}) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [employees, setEmployees] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // Reset after the close animation so a second open starts fresh.
      setTimeout(() => {
        setSubmitted(false);
        setEmployees(null);
        setConsent(false);
      }, 200);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" strokeWidth={1.5} />
            <DialogTitle>{dict.thankYouTitle}</DialogTitle>
            <DialogDescription>{dict.thankYouBody}</DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{dict.title}</DialogTitle>
              <DialogDescription>{dict.subtitle}</DialogDescription>
            </DialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor="demo-agency" className="text-sm font-medium text-espresso">
                  {dict.agencyNameLabel}
                </label>
                <input
                  id="demo-agency"
                  name="agencyName"
                  required
                  placeholder={dict.agencyNamePlaceholder}
                  className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-terracotta"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="demo-email" className="text-sm font-medium text-espresso">
                  {dict.businessEmailLabel}
                </label>
                <input
                  id="demo-email"
                  name="email"
                  type="email"
                  required
                  placeholder={dict.businessEmailPlaceholder}
                  className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-terracotta"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-espresso">{dict.phoneNumberLabel}</label>
                <PhoneInput name="phone" placeholder="077 123456" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-espresso">{dict.employeesLabel}</label>
                <div className="grid grid-cols-3 gap-2">
                  {EMPLOYEE_BUCKETS.map((bucket) => (
                    <button
                      key={bucket}
                      type="button"
                      onClick={() => setEmployees(bucket)}
                      className={cn(
                        "rounded-[10px] border px-3 py-2 text-sm transition-colors",
                        employees === bucket
                          ? "border-terracotta bg-terracotta/10 font-medium text-terracotta-700"
                          : "border-terracotta/25 bg-white text-espresso hover:bg-cream-100",
                      )}
                    >
                      {bucket}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="employees" value={employees ?? ""} required />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="demo-message" className="text-sm font-medium text-espresso">
                  {dict.whatLookingForLabel}
                </label>
                <textarea
                  id="demo-message"
                  name="message"
                  rows={3}
                  placeholder={dict.whatLookingForPlaceholder}
                  className="resize-none rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-terracotta"
                />
              </div>

              <button
                type="submit"
                className="rounded-full bg-terracotta px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-terracotta-700"
              >
                {dict.submit}
              </button>

              <label className="flex items-start gap-2 text-xs text-espresso-muted">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-terracotta"
                />
                {dict.consent}
              </label>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
