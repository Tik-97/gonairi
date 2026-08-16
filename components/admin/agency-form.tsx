"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createOrganization } from "@/lib/actions/platform-admin";

const inputClass =
  "rounded-[10px] border border-terracotta/25 bg-white px-3.5 py-2.5 text-espresso focus:border-terracotta focus:outline-none";

export function AgencyForm({
  owners,
}: {
  owners: { id: string; name: string; email: string; agencyCount: number }[];
}) {
  const [state, action, pending] = useActionState(createOrganization, undefined);

  return (
    <form action={action} className="flex max-w-lg flex-col gap-4 rounded-[18px] bg-card p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <h2 className="font-serif text-xl font-semibold text-espresso">Create travel agency</h2>
      <label className="flex flex-col gap-1 text-sm">
        Agency name
        <input name="organizationName" required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Agency owner
        <select name="ownerId" required defaultValue="" className={inputClass}>
          <option value="" disabled>Select an existing Owner user…</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name} · {owner.email} · {owner.agencyCount} {owner.agencyCount === 1 ? "agency" : "agencies"}
            </option>
          ))}
        </select>
      </label>
      {owners.length === 0 && (
        <p className="text-sm text-espresso-muted">
          Create a user with the Owner role in <Link href="/admin/users" className="text-terracotta-700 underline">All users</Link> first.
        </p>
      )}
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending || owners.length === 0}
        className="w-fit rounded-[10px] bg-terracotta px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create agency"}
      </button>
    </form>
  );
}
