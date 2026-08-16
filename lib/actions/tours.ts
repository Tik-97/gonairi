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

const TourSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters."),
  description: z.string().trim().optional(),
  category: z.string().trim().optional(),
  durationDays: z.coerce.number().int().min(1),
  basePrice: z.coerce.number().min(0),
  isPublished: z.coerce.boolean().optional(),
  images: z.array(z.string().trim()).max(MAX_TOUR_IMAGES, `You can add up to ${MAX_TOUR_IMAGES} images.`),
  regions: z.array(z.string().trim()).min(1, "Select at least one region."),
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
  const regions = formData
    .getAll("regions")
    .map((v) => v.toString().trim())
    .filter(Boolean);

  return TourSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    durationDays: formData.get("durationDays"),
    basePrice: formData.get("basePrice"),
    isPublished: formData.get("isPublished"),
    images,
    regions,
  });
}

export async function createTour(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await requirePermission(PERMISSIONS.toursManage);
  const parsed = parseTourForm(formData);
  if (!parsed.success) {
    return formStateFromZodError(parsed.error);
  }

  const db = scopedPrisma(session.user.organizationId);
  const slug = await uniqueTourSlug(db, parsed.data.title);

  const tour = await db.tour.create({
    data: {
      organizationId: session.user.organizationId,
      title: parsed.data.title,
      slug,
      description: parsed.data.description || null,
      category: parsed.data.category || null,
      durationDays: parsed.data.durationDays,
      basePrice: parsed.data.basePrice,
      isPublished: Boolean(parsed.data.isPublished),
      regions: parsed.data.regions,
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
  const existing = await db.tour.findFirst({ where: { id: tourId, deletedAt: null } });
  if (!existing) {
    return { error: "Tour not found." };
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
      category: parsed.data.category || null,
      durationDays: parsed.data.durationDays,
      basePrice: parsed.data.basePrice,
      isPublished: Boolean(parsed.data.isPublished),
      images: parsed.data.images,
      regions: parsed.data.regions,
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
