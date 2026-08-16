"use client";

import { useActionState } from "react";
import { createPlatformUser } from "@/lib/actions/platform-users";
import { ROLE_LABELS } from "@/lib/auth/role-labels";
import type { UserRole } from "@/generated/prisma/enums";

const inputClass =
  "rounded-[10px] border border-terracotta/25 bg-white px-3.5 py-2.5 text-espresso focus:border-terracotta focus:outline-none";

const ROLE_OPTIONS = Object.entries(ROLE_LABELS) as [UserRole, string][];

export function PlatformUserForm({
  organizations,
}: {
  organizations: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createPlatformUser, undefined);

  return (
    <form action={action} className="grid gap-4 rounded-[18px] bg-card p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] md:grid-cols-2">
      <h2 className="font-serif text-xl font-semibold text-espresso md:col-span-2">Create standard user</h2>
      <label className="flex flex-col gap-1 text-sm">
        Agency <span className="text-xs text-espresso-muted">(optional for an Owner candidate)</span>
        <select name="organizationId" defaultValue="" className={inputClass}>
          <option value="">Unassigned — select Owner role below</option>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>{organization.name}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input name="name" required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input name="email" type="email" required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Temporary password
        <input name="password" type="password" minLength={8} required className={inputClass} />
      </label>
      <fieldset className="flex flex-col gap-2 md:col-span-2">
        <legend className="mb-1 text-sm font-medium">Roles</legend>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map(([role, label]) => (
            <label key={role} className="flex items-center gap-2 rounded-full border border-terracotta/25 bg-white px-3 py-2 text-sm has-[:checked]:border-terracotta has-[:checked]:bg-terracotta/5">
              <input type="checkbox" name="roles" value={role} className="h-4 w-4" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {state?.error && <p className="text-sm text-danger md:col-span-2">{state.error}</p>}
      <button type="submit" disabled={pending} className="w-fit rounded-[10px] bg-terracotta px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 md:col-span-2">
        {pending ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}
