"use client";

import { useActionState } from "react";
import { createPlatformUser } from "@/lib/actions/platform-users";
import type { UserRole } from "@/generated/prisma/enums";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

const inputClass =
  "mt-auto rounded-[10px] border border-terracotta/25 bg-white px-3.5 py-2.5 text-espresso focus:border-terracotta focus:outline-none";

export function PlatformUserForm({
  organizations,
  dict,
}: {
  organizations: { id: string; name: string }[];
  dict: Dictionary["platformUserForm"] & { roles: Dictionary["roles"] };
}) {
  const [state, action, pending] = useActionState(createPlatformUser, undefined);
  const roleOptions = Object.entries(dict.roles) as [UserRole, string][];

  return (
    <form action={action} className="grid gap-4 rounded-[18px] bg-card p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] md:grid-cols-2">
      <h2 className="font-serif text-xl font-semibold text-espresso md:col-span-2">{dict.title}</h2>
      <label className="flex flex-col gap-1 text-sm">
        {dict.agency} <span className="text-xs text-espresso-muted">{dict.agencyHint}</span>
        <select name="organizationId" defaultValue="" className={inputClass}>
          <option value="">{dict.agencyUnassigned}</option>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>{organization.name}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.name}
        <input name="name" required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.email}
        <input name="email" type="email" required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {dict.temporaryPassword}
        <input name="password" type="password" minLength={8} required className={inputClass} />
      </label>
      <fieldset className="flex flex-col gap-2 md:col-span-2">
        <legend className="mb-1 text-sm font-medium">{dict.rolesLabel}</legend>
        <div className="flex flex-wrap gap-2">
          {roleOptions.map(([role, label]) => (
            <label key={role} className="flex items-center gap-2 rounded-full border border-terracotta/25 bg-white px-3 py-2 text-sm has-[:checked]:border-terracotta has-[:checked]:bg-terracotta/5">
              <input type="checkbox" name="roles" value={role} className="h-4 w-4" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {state?.error && <p className="text-sm text-danger md:col-span-2">{state.error}</p>}
      <button type="submit" disabled={pending} className="w-fit rounded-[10px] bg-terracotta px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 md:col-span-2">
        {pending ? dict.submitting : dict.submit}
      </button>
    </form>
  );
}
