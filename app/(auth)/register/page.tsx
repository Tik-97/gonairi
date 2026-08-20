import Link from "next/link";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function RegisterPage() {
  const { dict } = await getDictionary();

  return (
    <>
      <h1 className="mb-4 font-serif text-2xl font-semibold text-espresso">{dict.registerPage.title}</h1>
      <p className="text-sm text-espresso-muted">
        {dict.registerPage.message}
      </p>
      <p className="mt-6 text-sm">
        <Link href="/login" className="font-medium text-terracotta-700 underline">
          {dict.registerPage.goToLogin}
        </Link>
      </p>
    </>
  );
}
