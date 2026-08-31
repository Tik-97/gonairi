import Link from "next/link";
import { Map as MapIcon } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS, roleHasPermission } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { deleteTour, restoreTour } from "@/lib/actions/tours";
import { sortByNextDeparture } from "@/lib/tours/sort";
import { formatMoney } from "@/lib/format";
import { LocalDateTime } from "@/components/local-date-time";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SearchInput } from "@/components/dashboard/search-input";
import { PaginationControls } from "@/components/pagination-controls";
import { parsePagination, type PaginationParams } from "@/lib/pagination";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function ToursPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string } & PaginationParams>;
}) {
  const [params, { dict }] = await Promise.all([searchParams, getDictionary()]);
  const { q, view } = params;
  const pagination = parsePagination(params);
  const showDeleted = view === "deleted";
  const session = await requirePermission(PERMISSIONS.toursView);
  const [canManage, canDelete] = await Promise.all([
    roleHasPermission(session.user.role, PERMISSIONS.toursManage),
    roleHasPermission(session.user.role, PERMISSIONS.toursDelete),
  ]);
  const db = scopedPrisma(session.user.organizationId);
  const where = {
      deletedAt: showDeleted ? { not: null } : null,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { description: { contains: q, mode: "insensitive" as const } },
              { tourCustomers: { some: { customer: { fullName: { contains: q, mode: "insensitive" as const } } } } },
            ],
          }
        : {}),
  };
  const [toursRaw, totalItems] = await Promise.all([
    db.tour.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      select: {
        id: true,
        title: true,
        basePrice: true,
        currency: true,
        durationDays: true,
        deletedAt: true,
        isPublished: true,
        isPrivate: true,
        images: true,
        tourCustomers: {
          orderBy: { createdAt: "asc" },
          select: { customer: { select: { id: true, fullName: true } } },
        },
        departures: {
          where: { status: { not: "CANCELLED" }, date: { gte: new Date() } },
          orderBy: { date: "asc" },
          take: 1,
          select: { date: true },
        },
      },
    }),
    db.tour.count({ where }),
  ]);

  const tours = sortByNextDeparture(toursRaw);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={dict.toursPage.eyebrow}
        title={dict.toursPage.title}
        subtitle={dict.toursPage.subtitle}
        action={
          canManage && (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/tours/new?type=individual"
                className="rounded-[12px] border border-terracotta/30 px-5 py-2.5 text-sm font-medium text-terracotta-700 transition-colors hover:bg-cream-100"
              >
                {dict.toursPage.newIndividualTourButton}
              </Link>
              <Link
                href="/dashboard/tours/new"
                className="rounded-[12px] bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-700"
              >
                {dict.toursPage.newTourButton}
              </Link>
            </div>
          )
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 text-sm">
          <Link
            href="/dashboard/tours"
            className={`rounded-full px-4 py-2 ${!showDeleted ? "bg-terracotta text-white" : "bg-card text-espresso-muted"}`}
          >
            {dict.toursPage.active}
          </Link>
          <Link
            href="/dashboard/tours?view=deleted"
            className={`rounded-full px-4 py-2 ${showDeleted ? "bg-terracotta text-white" : "bg-card text-espresso-muted"}`}
          >
            {dict.toursPage.deleted}
          </Link>
        </div>
        <SearchInput placeholder={dict.toursPage.searchPlaceholder} />
      </div>

      {tours.length === 0 ? (
        <EmptyState
          title={q ? dict.toursPage.emptyNoMatchTitle : showDeleted ? dict.toursPage.emptyNoDeletedTitle : dict.toursPage.emptyWaitingTitle}
          message={
            q
              ? dict.toursPage.emptyNoMatchMessage
              : showDeleted
                ? dict.toursPage.emptyNoDeletedMessage
                : dict.toursPage.emptyWaitingMessage
          }
        />
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-[18px] bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          {tours.map((tour) => {
            const nextDeparture = tour.departures[0];
            return (
              <div
                key={tour.id}
                className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4"
              >
                <div className="flex items-center gap-3">
                  {tour.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tour.images[0]}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-[10px] object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-terracotta/10">
                      <MapIcon
                        className="h-5 w-5 text-terracotta-700"
                        strokeWidth={1.75}
                      />
                    </span>
                  )}
                  <div>
                    <p className="font-medium text-espresso">{tour.title}</p>
                    <p className="text-sm text-espresso-muted">
                      {formatMoney(tour.basePrice.toString(), tour.currency)} ·{" "}
                      {tour.durationDays}{dict.toursPage.daySuffix} ·{" "}
                      {showDeleted
                        ? dict.toursPage.deletedBadge
                        : tour.isPrivate
                          ? dict.toursPage.individualBadge
                          : tour.isPublished
                            ? dict.toursPage.publishedBadge
                            : dict.toursPage.draftBadge}
                    </p>
                    {tour.isPrivate && (
                      <p className="mt-1 text-xs text-espresso-muted">
                        {tour.tourCustomers.map(({ customer }) => customer.fullName).join(" · ")}
                      </p>
                    )}
                    <p className="mt-1 text-sm font-medium text-terracotta-700">
                      {nextDeparture
                        ? <>{dict.toursPage.nextDeparturePrefix} <LocalDateTime value={nextDeparture.date.toISOString()} /></>
                        : dict.toursPage.noUpcomingDepartures}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  {!showDeleted && (
                    <Link
                      href={`/dashboard/tours/${tour.id}/departures`}
                      className="text-terracotta-700 underline"
                    >
                      {dict.toursPage.departuresLink}
                    </Link>
                  )}
                  {!showDeleted && canManage && (
                    <Link
                      href={`/dashboard/tours/${tour.id}/edit`}
                      className="text-terracotta-700 underline"
                    >
                      {dict.toursPage.editLink}
                    </Link>
                  )}
                  {!showDeleted && canDelete && (
                    <form action={deleteTour.bind(null, tour.id)}>
                      <button type="submit" className="text-danger underline">
                        {dict.toursPage.deleteLink}
                      </button>
                    </form>
                  )}
                  {showDeleted && canDelete && (
                    <form action={restoreTour.bind(null, tour.id)}>
                      <button type="submit" className="text-terracotta-700 underline">
                        {dict.toursPage.restoreLink}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <PaginationControls totalItems={totalItems} page={pagination.page} perPage={pagination.perPage} />
    </div>
  );
}
