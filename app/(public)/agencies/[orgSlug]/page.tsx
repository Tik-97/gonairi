import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { PaginationControls } from "@/components/pagination-controls";
import { parsePagination, type PaginationParams } from "@/lib/pagination";

export default async function AgencyProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<PaginationParams>;
}) {
  const { orgSlug } = await params;
  const pagination = parsePagination(await searchParams);

  const organization = await prisma.organization.findFirst({
    where: { slug: orgSlug, isPublished: true },
  });
  if (!organization) {
    notFound();
  }
  const tourWhere = { organizationId: organization.id, isPublished: true, deletedAt: null };
  const [tours, totalItems] = await Promise.all([
    prisma.tour.findMany({ where: tourWhere, orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take }),
    prisma.tour.count({ where: tourWhere }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-4xl font-semibold text-espresso">{organization.name}</h1>
        {organization.description && (
          <p className="mt-3 max-w-2xl text-espresso/70">{organization.description}</p>
        )}
        {(organization.contactEmail || organization.contactPhone) && (
          <p className="mt-3 text-sm text-espresso/50">
            {[organization.contactEmail, organization.contactPhone].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-4 font-serif text-xl font-semibold text-espresso">Tours</h2>
        {tours.length === 0 ? (
          <p className="text-sm text-espresso/60">No published tours yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {tours.map((tour) => (
              <Link
                key={tour.id}
                href={`/tours/${tour.id}`}
                className="group rounded-2xl border border-terracotta/15 bg-white/70 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="font-serif text-lg font-medium text-espresso group-hover:text-brick">{tour.title}</p>
                <p className="mt-3 text-sm font-medium text-terracotta-700">
                  {formatMoney(tour.basePrice.toString(), tour.currency)}
                  <span className="font-normal text-espresso/50"> · {tour.durationDays}d</span>
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
      <PaginationControls totalItems={totalItems} page={pagination.page} perPage={pagination.perPage} />
    </div>
  );
}
