import { Mail } from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function ContactUsPage() {
  const { dict } = await getDictionary();
  const t = dict.marketing.contactUsPage;

  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-3xl font-semibold text-espresso sm:text-4xl">{t.title}</h1>
        <p className="mt-3 text-espresso/70">{t.subtitle}</p>
      </div>

      <div className="mx-auto mt-10 flex max-w-lg items-center justify-center gap-2 text-sm text-espresso/70">
        <Mail className="h-4 w-4 text-terracotta-700" strokeWidth={1.75} />
        <a href="mailto:hello@gonairi.com" className="font-medium text-terracotta-700 hover:underline">
          hello@gonairi.com
        </a>
      </div>

      <div className="mx-auto mt-10 max-w-lg">
        <ContactForm dict={dict.marketing.contactForm} />
      </div>
    </section>
  );
}
