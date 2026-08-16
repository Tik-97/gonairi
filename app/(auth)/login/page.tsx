"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";

const inputClass =
  "rounded-md border border-terracotta/25 bg-white px-3.5 py-2.5 text-espresso focus:border-terracotta focus:outline-none";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-espresso">Log in</h1>
      <p className="mb-5 text-sm text-espresso-muted">Use your agency or Super Admin credentials.</p>
      <form action={action} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-espresso-muted">
          Email
          <input name="email" type="email" required className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-espresso-muted">
          Password
          <input name="password" type="password" required className={inputClass} />
        </label>
        {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-full bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-700 disabled:opacity-50"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-sm text-espresso-muted">Agency accounts are created by the platform administrator.</p>
    </>
  );
}
