import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export default async function ToursSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;

  const tours = await prisma.tour.findMany({
    where: {
      isPublished: true,
      deletedAt: null,
      organization: { isPublished: true },
      ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    },
    include: { organization: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-semibold text-espresso">Tours in Armenia</h1>
      <form className="flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search tours…"
          className="w-full max-w-sm rounded-full border border-terracotta/25 bg-white px-4 py-2.5 text-sm text-espresso placeholder:text-espresso/40 focus:border-terracotta focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-terracotta px-5 py-2.5 text-sm font-medium text-white hover:bg-terracotta-700"
        >
          Search
        </button>
      </form>

      {tours.length === 0 ? (
        <p className="text-sm text-espresso/60">No tours found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {tours.map((tour) => (
            <Link
              key={tour.id}
              href={`/tours/${tour.id}`}
              className="group rounded-2xl border border-terracotta/15 bg-white/70 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="font-serif text-lg font-medium text-espresso group-hover:text-brick">
                {tour.title}
              </p>
              <p className="text-sm text-espresso/60">{tour.organization.name}</p>
              <p className="mt-3 text-sm font-medium text-terracotta-700">
                {formatMoney(tour.basePrice.toString(), tour.currency)}
                <span className="font-normal text-espresso/50"> · {tour.durationDays}d</span>
                {tour.category ? <span className="font-normal text-espresso/50"> · {tour.category}</span> : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
