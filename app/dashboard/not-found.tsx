import Link from "next/link";
import { Compass } from "lucide-react";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function DashboardNotFound() {
  const { dict } = await getDictionary();
  return (
    <div className="flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      <Compass className="h-16 w-16 text-terracotta opacity-30" strokeWidth={1.25} />
      <p className="font-serif text-lg text-espresso">{dict.notFoundPage.couldNotFindTitle}</p>
      <p className="max-w-xs text-sm text-espresso-muted">
        {dict.notFoundPage.message}
      </p>
      <Link
        href="/dashboard"
        className="mt-1 rounded-[12px] bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-700"
      >
        {dict.notFoundPage.backToDashboard}
      </Link>
    </div>
  );
}
