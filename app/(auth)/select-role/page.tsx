import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { selectActiveRole } from "@/lib/actions/auth";
import { isBackOfficeRole } from "@/lib/auth/permissions";
import { ROLE_LABELS } from "@/lib/auth/role-labels";

export default async function SelectRolePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.platformAdmin) {
    redirect("/admin/overview");
  }

  const account = await prisma.user.findFirst({
    where: { id: session.user.id, status: "ACTIVE" },
    select: { roles: true },
  });
  if (!account || account.roles.length === 0) {
    redirect("/login");
  }
  if (account.roles.length === 1 && session.user.role === account.roles[0]) {
    redirect(isBackOfficeRole(account.roles[0]) ? "/dashboard" : "/dashboard/schedule");
  }

  return (
    <>
      <h1 className="mb-2 font-serif text-2xl font-semibold text-espresso">Choose your role</h1>
      <p className="mb-6 text-sm text-espresso-muted">
        Your permissions and dashboard will use the role you select. You can change it later from your profile.
      </p>
      <div className="flex flex-col gap-3">
        {account.roles.map((role) => (
          <form key={role} action={selectActiveRole.bind(null, role)}>
            <button
              type="submit"
              className="w-full rounded-[12px] border border-terracotta/25 bg-white px-4 py-3 text-left font-medium text-espresso transition-colors hover:border-terracotta hover:bg-terracotta/5"
            >
              Continue as {ROLE_LABELS[role]}
            </button>
          </form>
        ))}
      </div>
    </>
  );
}
