"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

export function ContactForm({ dict }: { dict: Dictionary["marketing"]["contactForm"] }) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-terracotta/15 bg-white p-10 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <CheckCircle2 className="h-10 w-10 text-success" strokeWidth={1.5} />
        <h3 className="font-serif text-xl font-semibold text-espresso">{dict.sentTitle}</h3>
        <p className="text-espresso-muted">{dict.sentBody}</p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-2xl border border-terracotta/15 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-name" className="text-sm font-medium text-espresso">
          {dict.nameLabel}
        </label>
        <input
          id="contact-name"
          name="name"
          required
          placeholder={dict.namePlaceholder}
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-terracotta"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-email" className="text-sm font-medium text-espresso">
          {dict.emailLabel}
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          placeholder={dict.emailPlaceholder}
          className="rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-terracotta"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-message" className="text-sm font-medium text-espresso">
          {dict.messageLabel}
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          placeholder={dict.messagePlaceholder}
          className="resize-none rounded-[12px] border border-terracotta/25 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-terracotta"
        />
      </div>

      <button
        type="submit"
        className="rounded-full bg-terracotta px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-terracotta-700"
      >
        {dict.submit}
      </button>
    </form>
  );
}
