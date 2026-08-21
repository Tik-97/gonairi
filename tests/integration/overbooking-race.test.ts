import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { scopedPrisma } from "@/lib/db/scoped";
import { createBooking, NotEnoughAvailabilityError } from "@/lib/bookings/create-booking";
import { createTestOrganization, deleteTestOrganization } from "./helpers";

/**
 * The single most safety-critical piece of business logic in the app (see
 * ARCHITECTURE_AUDIT.md §3-C): an atomic conditional UPDATE prevents two concurrent
 * bookings from both succeeding for the same last seats. This fires real concurrent
 * requests at the real database — a mocked/serialized test would not exercise the
 * race at all, since the whole point is what happens when requests overlap.
 */
describe("createBooking overbooking race", () => {
  const CAPACITY = 3;
  let org: Awaited<ReturnType<typeof createTestOrganization>>;
  let customerId: string;
  let departureId: string;

  beforeAll(async () => {
    org = await createTestOrganization("Race");
    const db = scopedPrisma(org.id);

    const tour = await db.tour.create({
      data: {
        organizationId: org.id,
        title: "Race Test Tour",
        slug: "race-test-tour",
        basePrice: 10000,
        languagesOffered: [],
        images: [],
        tourRegions: {
          create: { region: { connect: { isoCode: "AM-ER" } } },
        },
      },
    });
    const departure = await db.departure.create({
      data: {
        organizationId: org.id,
        tourId: tour.id,
        date: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        capacity: CAPACITY,
      },
    });
    const customer = await db.customer.create({ data: { organizationId: org.id, fullName: "Race Test Customer" } });

    departureId = departure.id;
    customerId = customer.id;
  });

  afterAll(async () => {
    await deleteTestOrganization(org.id);
  });

  it("lets exactly `capacity` concurrent 1-pax bookings succeed, rejects the rest, and never overcounts bookedCount", async () => {
    const CONCURRENT_REQUESTS = CAPACITY + 4; // deliberately more requests than seats

    const results = await Promise.allSettled(
      Array.from({ length: CONCURRENT_REQUESTS }, () =>
        createBooking({
          organizationId: org.id,
          departureId,
          customerId,
          paxCount: 1,
          totalPrice: 10000,
          currency: "AMD",
          source: "MANUAL",
        }),
      ),
    );

    const succeeded = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");

    expect(succeeded.length).toBe(CAPACITY);
    expect(failed.length).toBe(CONCURRENT_REQUESTS - CAPACITY);
    for (const failure of failed) {
      if (failure.status === "rejected") {
        expect(failure.reason).toBeInstanceOf(NotEnoughAvailabilityError);
      }
    }

    const finalDeparture = await prisma.departure.findUniqueOrThrow({ where: { id: departureId } });
    expect(finalDeparture.bookedCount).toBe(CAPACITY);

    const bookingCount = await prisma.booking.count({ where: { departureId } });
    expect(bookingCount).toBe(CAPACITY);
  });
});
