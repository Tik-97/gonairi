import { prisma } from "@/lib/db";

/** Ephemeral org for a single test file — always clean up with deleteTestOrganization(). */
export async function createTestOrganization(label: string) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return prisma.$transaction(async (tx) => {
    const owner = await tx.user.create({
      data: {
        name: `Vitest Owner ${stamp}`,
        email: `vitest-owner-${stamp}@example.com`.toLowerCase(),
        passwordHash: "test-only",
        roles: ["OWNER"],
      },
    });
    const organization = await tx.organization.create({
      data: {
        name: `Vitest Org ${label} ${stamp}`,
        slug: `vitest-org-${label}-${stamp}`.toLowerCase(),
        ownerId: owner.id,
      },
    });
    await tx.user.update({
      where: { id: owner.id },
      data: { organizationId: organization.id },
    });
    return organization;
  });
}

/** Removes tenant rows plus the test-only owner created for this organization. */
export async function deleteTestOrganization(organizationId: string) {
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { ownerId: true },
  });
  await prisma.user.deleteMany({
    where: { organizationId, id: { not: organization.ownerId } },
  });
  await prisma.user.update({
    where: { id: organization.ownerId },
    data: { organizationId: null },
  });
  await prisma.organization.delete({ where: { id: organizationId } });
  await prisma.user.delete({ where: { id: organization.ownerId } });
}
