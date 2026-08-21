import "server-only";

import { prisma } from "@/lib/db";
import type { CategoryOption } from "@/types/category";

export async function listCategoryOptions(selectedCategoryIds: string[] = []): Promise<CategoryOption[]> {
  const selectedWhere =
    selectedCategoryIds.length > 0 ? { id: { in: selectedCategoryIds } } : undefined;

  return prisma.category.findMany({
    where: selectedWhere ? { OR: [{ isActive: true }, selectedWhere] } : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: { id: true, slug: true, label: true, isActive: true },
  });
}
