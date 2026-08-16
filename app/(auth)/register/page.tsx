import Link from "next/link";

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-4 font-serif text-2xl font-semibold text-espresso">Agency accounts are provisioned by GoNairi</h1>
      <p className="text-sm text-espresso-muted">
        A platform administrator creates each travel agency and its Owner account. If your agency has already been created, use the credentials provided to you.
      </p>
      <p className="mt-6 text-sm">
        <Link href="/login" className="font-medium text-terracotta-700 underline">
          Go to agency login
        </Link>
      </p>
    </>
  );
}
