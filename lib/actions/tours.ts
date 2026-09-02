"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { slugify, uniqueSlug } from "@/lib/slug";
import { formStateFromZodError, type FormState } from "@/lib/form-state";

const MAX_TOUR_IMAGES = 10;
const MAX_TOUR_REGIONS = 50;
const MAX_TOUR_CATEGORIES = 10;

const TourSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters."),
  description: z.string().trim().optional(),
  categoryIds: z
    .array(z.string().trim().min(1))
    .max(MAX_TOUR_CATEGORIES, `You can select up to ${MAX_TOUR_CATEGORIES} hashtags.`)
    .refine((values) => new Set(values).size === values.length, "A hashtag can be selected only once."),
  durationDays: z.coerce.number().int().min(1),
  basePrice: z.coerce.number().min(0),
  isPublished: z.coerce.boolean().optional(),
  images: z.array(z.string().trim()).max(MAX_TOUR_IMAGES, `You can add up to ${MAX_TOUR_IMAGES} images.`),
  regionIds: z
    .array(z.string().trim().min(1))
    .min(1, "Select at least one region.")
    .max(MAX_TOUR_REGIONS, `You can select up to ${MAX_TOUR_REGIONS} regions.`)
    .refine((values) => new Set(values).size === values.length, "A region can be selected only once."),
});

async function uniqueTourSlug(
  db: ReturnType<typeof scopedPrisma>,
  title: string,
  excludeTourId?: string,
): Promise<string> {
  const base = slugify(title) || "tour";
  return uniqueSlug(base, async (candidate) =>
    Boolean(
      await db.tour.findFirst({
        where: excludeTourId ? { slug: candidate, NOT: { id: excludeTourId } } : { slug: candidate },
      }),
    ),
  );
}

function parseTourForm(formData: FormData) {
  const images = formData
    .getAll("images")
    .map((v) => v.toString().trim())
    .filter(Boolean)
    .slice(0, MAX_TOUR_IMAGES);
  const regionIds = formData
    .getAll("regionIds")
    .map((v) => v.toString().trim())
    .filter(Boolean);
  const categoryIds = formData
    .getAll("categoryIds")
    .map((v) => v.toString().trim())
    .filter(Boolean);
  return TourSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryIds,
    durationDays: formData.get("durationDays"),
    basePrice: formData.get("basePrice"),
    isPublished: formData.get("isPublished"),
    images,
    regionIds,
  });
}

async function categorySelectionIsValid(
  db: ReturnType<typeof scopedPrisma>,
  categoryIds: string[],
  allowedInactiveCategoryIds: string[] = [],
) {
  if (categoryIds.length === 0) return true;

  const categories = await db.category.findMany({
    where: {
      id: { in: categoryIds },
      OR: [
        { isActive: true },
        ...(allowedInactiveCategoryIds.length > 0
          ? [{ id: { in: allowedInactiveCategoryIds } }]
          : []),
      ],
    },
    select: { id: true },
  });

  return categories.length === categoryIds.length;
}

async function regionSelectionIsValid(
  db: ReturnType<typeof scopedPrisma>,
  regionIds: string[],
  allowedInactiveRegionIds: string[] = [],
) {
  const regions = await db.region.findMany({
    where: {
      id: { in: regionIds },
      OR: [
        { isActive: true, country: { isActive: true } },
        ...(allowedInactiveRegionIds.length > 0 ? [{ id: { in: allowedInactiveRegionIds } }] : []),
      ],
    },
    select: { id: true },
  });

  return regions.length === regionIds.length;
}

export async function createTour(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await requirePermission(PERMISSIONS.toursManage);
  const parsed = parseTourForm(formData);
  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
  }

  const db = scopedPrisma(session.user.organizationId);
  if (!(await regionSelectionIsValid(db, parsed.data.regionIds))) {
    return { error: "One or more selected regions are unavailable. Refresh the page and try again." };
  }
  if (!(await categorySelectionIsValid(db, parsed.data.categoryIds))) {
    return { error: "One or more selected hashtags are unavailable. Refresh the page and try again." };
  }
  const slug = await uniqueTourSlug(db, parsed.data.title);

  const tour = await db.tour.create({
    data: {
      organizationId: session.user.organizationId,
      title: parsed.data.title,
      slug,
      description: parsed.data.description || null,
      durationDays: parsed.data.durationDays,
      basePrice: parsed.data.basePrice,
      isPublished: Boolean(parsed.data.isPublished),
      isPrivate: false,
      tourRegions: {
        create: parsed.data.regionIds.map((regionId, position) => ({ regionId, position })),
      },
      ...(parsed.data.categoryIds.length > 0
        ? {
            tourCategories: {
              create: parsed.data.categoryIds.map((categoryId, position) => ({ categoryId, position })),
            },
          }
        : {}),
      languagesOffered: [],
      images: parsed.data.images,
    },
  });

  redirect(`/dashboard/tours/${tour.id}/departures`);
}

export async function updateTour(
  tourId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requirePermission(PERMISSIONS.toursManage);
  const parsed = parseTourForm(formData);
  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
  }

  const db = scopedPrisma(session.user.organizationId);
  const existing = await db.tour.findFirst({
    where: { id: tourId, deletedAt: null },
    include: {
      tourRegions: { select: { regionId: true } },
      tourCategories: { select: { categoryId: true } },
    },
  });
  if (!existing) {
    return { error: "Tour not found." };
  }
  if (
    !(await regionSelectionIsValid(
      db,
      parsed.data.regionIds,
      existing.tourRegions.map(({ regionId }) => regionId),
    ))
  ) {
    return { error: "One or more selected regions are unavailable. Refresh the page and try again." };
  }
  if (
    !(await categorySelectionIsValid(
      db,
      parsed.data.categoryIds,
      existing.tourCategories.map(({ categoryId }) => categoryId),
    ))
  ) {
    return { error: "One or more selected hashtags are unavailable. Refresh the page and try again." };
  }

  const slug =
    slugify(parsed.data.title) === slugify(existing.title)
      ? existing.slug
      : await uniqueTourSlug(db, parsed.data.title, tourId);

  await db.tour.update({
    where: { id: tourId },
    data: {
      title: parsed.data.title,
      slug,
      description: parsed.data.description || null,
      durationDays: parsed.data.durationDays,
      basePrice: parsed.data.basePrice,
      isPublished: Boolean(parsed.data.isPublished),
      isPrivate: false,
      images: parsed.data.images,
      tourRegions: {
        deleteMany: {},
        create: parsed.data.regionIds.map((regionId, position) => ({ regionId, position })),
      },
      tourCategories: {
        deleteMany: {},
        ...(parsed.data.categoryIds.length > 0
          ? {
              create: parsed.data.categoryIds.map((categoryId, position) => ({ categoryId, position })),
            }
          : {}),
      },
    },
  });

  redirect("/dashboard/tours");
}

export async function deleteTour(tourId: string): Promise<void> {
  const session = await requirePermission(PERMISSIONS.toursDelete);
  const db = scopedPrisma(session.user.organizationId);

  const existing = await db.tour.findFirst({ where: { id: tourId, deletedAt: null } });
  if (!existing) {
    return;
  }

  await db.tour.update({
    where: { id: tourId },
    data: { deletedAt: new Date(), isPublished: false },
  });
  revalidatePath("/dashboard/tours");
}

export async function restoreTour(tourId: string): Promise<void> {
  const session = await requirePermission(PERMISSIONS.toursDelete);
  const db = scopedPrisma(session.user.organizationId);

  const existing = await db.tour.findFirst({
    where: { id: tourId, deletedAt: { not: null } },
  });
  if (!existing) {
    return;
  }

  await db.tour.update({
    where: { id: tourId },
    data: { deletedAt: null },
  });
  revalidatePath("/dashboard/tours");
}
