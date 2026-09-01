import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function PrivacyPolicyPage() {
  const { dict } = await getDictionary();
  const t = dict.marketing.privacyPolicyPage;
  const sections = Object.values(t.sections);

  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-serif text-3xl font-semibold text-espresso sm:text-4xl">{t.title}</h1>
      <p className="mt-2 text-sm text-espresso/50">{t.lastUpdated}</p>

      <div className="mt-10 flex flex-col gap-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="font-serif text-xl font-medium text-espresso">{section.title}</h2>
            {section.body.split("\n\n").map((paragraph, index) => (
              <p key={index} className="mt-2 text-espresso/70">{paragraph}</p>
            ))}
          </div>
        ))}

        <div>
          <h2 className="font-serif text-xl font-medium text-espresso">{t.contactTitle}</h2>
          <p className="mt-2 text-espresso/70">
            {t.contactBodyPrefix}
            <a href="mailto:hello@gonairi.com" className="font-medium text-terracotta-700 hover:underline">
              hello@gonairi.com
            </a>
            {t.contactBodyMiddle}
            <a href="/contact-us" className="font-medium text-terracotta-700 hover:underline">{t.contactPageLinkText}</a>
            {t.contactBodySuffix}
          </p>
        </div>
      </div>
    </section>
  );
}
