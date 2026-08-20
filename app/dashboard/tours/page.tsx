import Link from "next/link";
import { Map as MapIcon } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS, roleHasPermission } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import { deleteTour, restoreTour } from "@/lib/actions/tours";
import { sortByNextDeparture } from "@/lib/tours/sort";
import { formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SearchInput } from "@/components/dashboard/search-input";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function ToursPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string }>;
}) {
  const [{ q, view }, { dict }] = await Promise.all([searchParams, getDictionary()]);
  const showDeleted = view === "deleted";
  const session = await requirePermission(PERMISSIONS.toursView);
  const [canManage, canDelete] = await Promise.all([
    roleHasPermission(session.user.role, PERMISSIONS.toursManage),
    roleHasPermission(session.user.role, PERMISSIONS.toursDelete),
  ]);
  const db = scopedPrisma(session.user.organizationId);
  const toursRaw = await db.tour.findMany({
    where: {
      deletedAt: showDeleted ? { not: null } : null,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      departures: {
        where: { status: { not: "CANCELLED" }, date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: 1,
      },
    },
  });

  const tours = sortByNextDeparture(toursRaw);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={dict.toursPage.eyebrow}
        title={dict.toursPage.title}
        subtitle={dict.toursPage.subtitle}
        action={
          canManage && (
            <Link
              href="/dashboard/tours/new"
              className="rounded-[12px] bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-700"
            >
              {dict.toursPage.newTourButton}
            </Link>
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
                      {showDeleted ? dict.toursPage.deletedBadge : tour.isPublished ? dict.toursPage.publishedBadge : dict.toursPage.draftBadge}
                    </p>
                    <p className="mt-1 text-sm font-medium text-terracotta-700">
                      {nextDeparture
                        ? `${dict.toursPage.nextDeparturePrefix} ${formatDate(nextDeparture.date)}`
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
    </div>
  );
}
