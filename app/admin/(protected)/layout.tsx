import { requirePlatformAdmin } from "@/lib/auth/platform-admin-session";
import { logoutPlatformAdmin } from "@/lib/actions/platform-admin";

// See app/dashboard/layout.tsx for why this is required — no Request-time API
// is used directly, so this route would otherwise be eligible for Full Route
// Cache and could serve one admin's render to the next.
export const dynamic = "force-dynamic";

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePlatformAdmin();

  return (
    <div className="flex flex-1 flex-col bg-cream">
      <div className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-terracotta-700 uppercase">GoNairi · Super Admin</p>
          <p className="text-sm text-espresso-muted">{session.platformAdmin?.name}</p>
        </div>
        <form action={logoutPlatformAdmin}>
          <button type="submit" className="text-sm text-espresso-muted underline hover:text-espresso">
            Log out
          </button>
        </form>
      </div>
      <div className="flex-1 px-6 py-8 sm:px-10">{children}</div>
    </div>
  );
}
