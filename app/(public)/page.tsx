import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";

// Featured tours must reflect current publish/availability state, not a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featuredTours = await prisma.tour.findMany({
    where: { isPublished: true, deletedAt: null, organization: { isPublished: true } },
    include: { organization: true },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  return (
    <div className="flex flex-col gap-14">
      <div className="relative -mx-6 -mt-4 overflow-hidden rounded-3xl">
        <div className="relative h-[440px] sm:h-[480px]">
          <Image
            src="/images/KhorVirap.jpg"
            alt="Khor Virap monastery with Mount Ararat, Armenia"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[68%_45%] saturate-[0.55] sepia-[0.3] contrast-105"
          />
          {/* Unify the photo's color temperature with the warm palette. */}
          <div className="absolute inset-0 bg-terracotta/25 mix-blend-multiply" />
          <div className="absolute inset-0 bg-apricot/10 mix-blend-overlay" />
          {/* Let the photo emerge from the cream panel rather than sit behind a hard edge. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, var(--color-cream) 0%, var(--color-cream) 34%, rgb(251 243 231 / 0.7) 50%, rgb(251 243 231 / 0) 78%)",
            }}
          />
          <div className="absolute bottom-5 right-5 h-24 w-16 opacity-90 sm:h-32 sm:w-20">
            <Image
              src="/images/khachkar-hero.png"
              alt=""
              fill
              className="object-contain drop-shadow-lg"
            />
          </div>
          <div className="relative z-10 flex h-full max-w-lg flex-col justify-center gap-6 px-6 sm:px-12">
            <h1 className="font-serif text-5xl font-semibold leading-[1.1] tracking-tight text-espresso">
              Discover Armenia,<br /> one tour at a time.
            </h1>
            <p className="text-lg text-espresso/70">
              Browse tours from local Armenian agencies — monasteries, mountains, wine and
              gastronomy — and book directly, no middleman.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/tours"
                className="rounded-full bg-terracotta px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-terracotta-700"
              >
                Browse tours
              </Link>
            </div>
          </div>
        </div>
      </div>

      {featuredTours.length > 0 && (
        <div>
          <h2 className="mb-5 font-serif text-2xl font-semibold text-espresso">Featured tours</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {featuredTours.map((tour) => (
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
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
