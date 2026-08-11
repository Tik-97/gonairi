import { prisma } from "@/lib/db";

/** Ephemeral org for a single test file — always clean up with deleteTestOrganization(). */
export async function createTestOrganization(label: string) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return prisma.organization.create({
    data: {
      name: `Vitest Org ${label} ${stamp}`,
      slug: `vitest-org-${label}-${stamp}`.toLowerCase(),
    },
  });
}

/** Cascades to every tenant-scoped row created under this org (see schema.prisma onDelete: Cascade). */
export async function deleteTestOrganization(organizationId: string) {
  await prisma.organization.delete({ where: { id: organizationId } });
}
