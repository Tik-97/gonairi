"use client";

import { useActionState } from "react";
import { loginPlatformAdmin } from "@/lib/actions/platform-admin";

const inputClass =
  "rounded-md border border-terracotta/25 bg-white px-3.5 py-2.5 text-espresso focus:border-terracotta focus:outline-none";

export default function PlatformAdminLoginPage() {
  const [state, action, pending] = useActionState(loginPlatformAdmin, undefined);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center bg-cream px-4 py-16">
      <p className="mb-8 text-xs font-medium tracking-[0.2em] text-terracotta-700 uppercase">GoNairi · Super Admin</p>
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <h1 className="mb-6 font-serif text-2xl font-semibold text-espresso">Platform admin login</h1>
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
      </div>
    </div>
  );
}
