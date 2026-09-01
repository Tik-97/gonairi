// Bespoke, realistic demo agency for marketing screenshots — real Armenian
// destinations, real vehicle makes/models, and a curated set of customers and
// bookings, distinct from the QA fixture data in seed-demo-data.cjs (which is
// deliberately generic/numbered for pagination and tenant-isolation testing).
// Usage: npm run seed:marketing-demo
require("dotenv/config");

const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const { Client } = require("pg");
const { seedCategories } = require("./seed-categories.cjs");
const { seedGeography } = require("./seed-geography.cjs");

const DEMO_DOMAIN = "ararat-trails.test";
const DEMO_PASSWORD = process.env.MARKETING_DEMO_PASSWORD || "Showcase123!";

function deterministicId(key) {
  const hex = crypto.createHash("sha256").update(`gonairi-marketing-demo:${key}`).digest("hex").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function day(offset, hour = 9, minute = 0) {
  const value = new Date();
  value.setUTCHours(hour, minute, 0, 0);
  value.setUTCDate(value.getUTCDate() + offset);
  return value;
}

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

async function insertRows(client, table, columns, rows) {
  if (rows.length === 0) return;
  const chunkSize = Math.max(1, Math.floor(30_000 / columns.length));
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const values = [];
    const placeholders = chunk.map((row) => `(${row.map((value) => {
      values.push(value);
      return `$${values.length}`;
    }).join(", ")})`);
    await client.query(
      `INSERT INTO ${quoteIdentifier(table)} (${columns.map(quoteIdentifier).join(", ")}) VALUES ${placeholders.join(", ")}`,
      values,
    );
  }
}

const ORG_ID = deterministicId("organization");
const OWNER_ID = deterministicId("user:owner");

const STAFF = [
  { key: "operator", name: "Narine Sargsyan", roles: ["OPERATOR"] },
  { key: "guide-1", name: "Vardan Hakobyan", roles: ["GUIDE"] },
  { key: "guide-2", name: "Marine Avetisyan", roles: ["GUIDE"] },
  { key: "driver-1", name: "Ashot Grigoryan", roles: ["DRIVER"] },
  { key: "driver-2", name: "Aram Ghukasyan", roles: ["DRIVER"] },
  { key: "driver-guide", name: "Levon Sahakyan", roles: ["DRIVER_GUIDE"] },
];

const VEHICLES = [
  { key: "sprinter", name: "Mercedes-Benz Sprinter", type: "Minivan", capacity: 16, plate: "12 AA 345" },
  { key: "land-cruiser", name: "Toyota Land Cruiser 200", type: "Jeep", capacity: 4, plate: "34 BB 678" },
  { key: "transit", name: "Ford Transit", type: "Minivan", capacity: 12, plate: "56 CC 901" },
  { key: "setra", name: "Setra S 415 GT-HD", type: "Bus", capacity: 45, plate: "78 DD 234" },
  { key: "camry", name: "Toyota Camry", type: "Car", capacity: 3, plate: "90 EE 567" },
];

// regionCodes/categorySlugs are resolved to ids right before insert.
const TOURS = [
  {
    key: "khor-virap", title: "Khor Virap Monastery & Mount Ararat Views", durationDays: 1,
    description: "A short drive from Yerevan to the monastery with the closest views of Mount Ararat in Armenia, including the descent into Saint Gregory's pit.",
    basePrice: 15000, images: ["/images/khor-virap.jpg"], regionCodes: ["AM-AR"], categorySlugs: ["religious", "pilgrimage", "monasteries", "scenic"],
    included: "Transport, licensed guide, bottled water", excluded: "Lunch, entrance donations",
  },
  {
    key: "garni-geghard", title: "Garni Temple & Geghard Monastery", durationDays: 1,
    description: "The only Hellenistic temple in the former Soviet Union, followed by the UNESCO-listed Geghard Monastery carved into the cliffside.",
    basePrice: 18000, images: ["/images/Garni.jpg"], regionCodes: ["AM-KT"], categorySlugs: ["history", "archaeology", "monasteries", "heritage"],
    included: "Transport, licensed guide, entrance fees", excluded: "Lunch, gratuities",
  },
  {
    key: "noravank-areni", title: "Noravank Canyon & Areni Wine Tasting", durationDays: 1,
    description: "Red-cliff canyon views at Noravank Monastery followed by a tasting at a family winery in Areni, the cradle of Armenian winemaking.",
    basePrice: 22000, images: ["/images/Noravank.jpg", "/images/Areni.jpg"], regionCodes: ["AM-VD"], categorySlugs: ["wine", "monasteries", "scenic", "culinary"],
    included: "Transport, licensed guide, wine tasting", excluded: "Lunch, extra wine purchases",
  },
  {
    key: "sevan", title: "Lake Sevan Day Trip", durationDays: 1,
    description: "Armenia's largest lake, the hilltop Sevanavank Monastery, and a fresh-fish lunch stop by the shore.",
    basePrice: 16000, images: ["/images/Sevan.jpg"], regionCodes: ["AM-GR"], categorySlugs: ["lake", "nature", "family", "day-trip"],
    included: "Transport, licensed guide", excluded: "Lunch, swimming gear",
  },
  {
    key: "tatev", title: "Tatev Monastery & Wings of Tatev Cable Car", durationDays: 1,
    description: "The longest reversible cable car in the world to Tatev Monastery, perched above the Vorotan gorge in southern Armenia.",
    basePrice: 35000, images: ["/images/Tatev.jpg"], regionCodes: ["AM-SU"], categorySlugs: ["monasteries", "adventure", "scenic"],
    included: "Transport, cable car tickets, licensed guide", excluded: "Lunch",
  },
  {
    key: "dilijan-parz", title: "Dilijan & Parz Lake Nature Escape", durationDays: 1,
    description: "Forested mountain roads to the resort town of Dilijan and a walk around the calm waters of Parz Lake.",
    basePrice: 20000, images: ["/images/Parz.jpg"], regionCodes: ["AM-TV"], categorySlugs: ["nature", "hiking", "family"],
    included: "Transport, licensed guide", excluded: "Lunch, boat rides",
  },
  {
    key: "yerevan", title: "Yerevan City Highlights & Cascade", durationDays: 1,
    description: "A walking tour through Republic Square, the Cascade Complex, and Yerevan's café culture, with a stop at the Vernissage market.",
    basePrice: 12000, images: ["/images/Yerevan.jpg"], regionCodes: ["AM-ER"], categorySlugs: ["city", "architecture", "museums", "walking"],
    included: "Licensed guide", excluded: "Transport, museum entrance fees",
  },
  {
    key: "grand-armenia", title: "Grand Armenia: 5-Day Highlights Tour", durationDays: 5,
    description: "A five-day journey covering Yerevan, Khor Virap, Garni, Geghard, Lake Sevan, Dilijan, and Tatev Monastery — Armenia's essential sites in one trip.",
    basePrice: 185000, images: ["/images/khor-virap.jpg", "/images/Tatev.jpg"], regionCodes: ["AM-ER", "AM-SU"], categorySlugs: ["multi-day", "heritage", "cultural"],
    included: "Transport, licensed guide, hotels, breakfast", excluded: "Lunch, dinner, personal expenses",
    itinerary: [
      { day: 1, title: "Yerevan arrival & city tour" },
      { day: 2, title: "Khor Virap, Noravank & Areni wine tasting" },
      { day: 3, title: "Garni Temple & Geghard Monastery" },
      { day: 4, title: "Lake Sevan & Dilijan" },
      { day: 5, title: "Tatev Monastery & Wings of Tatev" },
    ],
  },
];

const CUSTOMERS = [
  { name: "Emily Carter", email: "emily.carter@example.com", phone: "+1 415 555 0132", nationality: "American" },
  { name: "Liam O'Sullivan", email: "liam.osullivan@example.com", phone: "+353 87 555 0198", nationality: "Irish" },
  { name: "Charlotte Dubois", email: "charlotte.dubois@example.com", phone: "+33 6 55 55 01 21", nationality: "French" },
  { name: "Lukas Weber", email: "lukas.weber@example.com", phone: "+49 151 5550187", nationality: "German" },
  { name: "Giulia Ferrari", email: "giulia.ferrari@example.com", phone: "+39 345 555 0176", nationality: "Italian" },
  { name: "Haruto Sato", email: "haruto.sato@example.com", phone: "+81 90 5555 0143", nationality: "Japanese" },
  { name: "Olga Ivanova", email: "olga.ivanova@example.com", phone: "+7 916 555 0165", nationality: "Russian" },
  { name: "Sofia Papadopoulos", email: "sofia.papadopoulos@example.com", phone: "+30 694 555 0154", nationality: "Greek" },
  { name: "Noah Jansen", email: "noah.jansen@example.com", phone: "+31 6 5555 0129", nationality: "Dutch" },
  { name: "Isabella Silva", email: "isabella.silva@example.com", phone: "+351 91 555 0118", nationality: "Portuguese" },
  { name: "William Chen", email: "william.chen@example.com", phone: "+65 8555 0112", nationality: "Singaporean" },
  { name: "Ani Petrosyan", email: "ani.petrosyan.traveler@example.com", phone: "+374 77 555 012", nationality: "Armenian" },
  { name: "David Grant", email: "david.grant@example.com", phone: "+44 7700 900312", nationality: "British" },
  { name: "Maria Gonzalez", email: "maria.gonzalez@example.com", phone: "+34 655 555 018", nationality: "Spanish" },
  { name: "Erik Johansson", email: "erik.johansson@example.com", phone: "+46 70 555 0143", nationality: "Swedish" },
  { name: "Chloe Martin", email: "chloe.martin@example.com", phone: "+61 4 5550 1187", nationality: "Australian" },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing. Add it to .env before seeding.");
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error("Marketing demo seeding is disabled in production. Set ALLOW_DEMO_SEED=true only if intentional.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = new Date();

  const ownerRow = [OWNER_ID, null, `owner@${DEMO_DOMAIN}`, passwordHash, "Anahit Petrosyan", "+374 91 234 567", ["OWNER"], "ACTIVE", day(-400), now];
  const organizationRow = [
    ORG_ID, OWNER_ID, "Ararat Trails", "ararat-trails",
    "Boutique day-tour and multi-day travel agency based in Yerevan, specializing in Armenia's monasteries, nature, and wine country.",
    null, `hello@${DEMO_DOMAIN}`, "+374 10 987 654", "12 Northern Avenue, Yerevan, Armenia", "en", "AMD", "Asia/Yerevan", true, day(-395), now,
  ];

  const staffRows = STAFF.map(({ key, name, roles }, index) => [
    deterministicId(`user:${key}`), ORG_ID, `${key}@${DEMO_DOMAIN}`, passwordHash, name,
    `+374 9${(index % 5) + 1} ${String(100000 + index * 37).slice(-6)}`, roles, "ACTIVE", day(-370 + index * 3), now,
  ]);

  const vehicleRows = VEHICLES.map(({ key, name, type, capacity, plate }, index) => [
    deterministicId(`vehicle:${key}`), ORG_ID, name, type, capacity, plate, null, null, true, day(-360 + index * 5), now,
  ]);
  const vehicleIdByKey = Object.fromEntries(VEHICLES.map((v) => [v.key, deterministicId(`vehicle:${v.key}`)]));

  const tourRows = [];
  const tourRegionCodesByTourId = new Map();
  const tourCategorySlugsByTourId = new Map();
  const tourIdByKey = {};
  TOURS.forEach((tour, index) => {
    const id = deterministicId(`tour:${tour.key}`);
    tourIdByKey[tour.key] = id;
    tourRegionCodesByTourId.set(id, tour.regionCodes);
    tourCategorySlugsByTourId.set(id, tour.categorySlugs);
    tourRows.push([
      id, ORG_ID, tour.title, tour.key, tour.description, tour.durationDays,
      ["hy", "en", "ru"], tour.images, tour.itinerary ? JSON.stringify(tour.itinerary) : null,
      tour.included, tour.excluded, tour.basePrice, "AMD", true, day(-300 + index * 6), now, null,
    ]);
  });

  // A handful of near-past departures (for booking/history depth) and a
  // steady stream of upcoming ones (for the dashboard's "upcoming" stat and
  // the last-30-days chart).
  const departureRows = [];
  const departuresByTourId = new Map();
  const vehicleAssignmentByTourKey = {
    "khor-virap": "sprinter", "garni-geghard": "sprinter", "noravank-areni": "transit",
    "sevan": "setra", "tatev": "land-cruiser", "dilijan-parz": "transit",
    "yerevan": "camry", "grand-armenia": "setra",
  };
  TOURS.forEach((tour, tourIndex) => {
    const tourId = tourIdByKey[tour.key];
    const vehicleKey = vehicleAssignmentByTourKey[tour.key];
    const capacity = VEHICLES.find((v) => v.key === vehicleKey).capacity;
    const offsets = tour.durationDays > 1
      ? [-14, 7, 21] // multi-day tour: fewer, further-apart departures
      : [-21, -13, -6, 4, 9, 15, 22, 29];
    const items = [];
    offsets.forEach((offset, index) => {
      const id = deterministicId(`departure:${tour.key}:${index}`);
      const past = offset < 0;
      const status = past ? (index === 0 && tourIndex === 4 ? "CANCELLED" : "COMPLETED") : index % 5 === 0 ? "SCHEDULED" : "CONFIRMED";
      const hour = 8 + (index % 3) * 2;
      const returnAt = new Date(day(offset, hour).getTime() + (tour.durationDays > 1 ? tour.durationDays * 24 : 7) * 60 * 60 * 1000);
      departureRows.push([
        id, ORG_ID, tourId, day(offset, hour), returnAt, capacity, 0, null, status,
        index % 4 === 0 ? "Pickup from hotel lobby 15 minutes before departure." : null, day(offset - 14), now,
      ]);
      items.push({ id, status, offset, capacity, vehicleKey });
    });
    departuresByTourId.set(tourId, items);
  });

  const departureVehicleRows = [];
  let staffCursor = 0;
  const driverKeys = ["driver-1", "driver-2", "driver-guide"];
  const guideKeys = ["guide-1", "guide-2", "driver-guide"];
  for (const [tourId, items] of departuresByTourId.entries()) {
    items.filter((item) => item.status !== "CANCELLED").forEach((item) => {
      const driverKey = driverKeys[staffCursor % driverKeys.length];
      const guideKey = guideKeys[(staffCursor + 1) % guideKeys.length];
      staffCursor += 1;
      departureVehicleRows.push([
        deterministicId(`departure-vehicle:${item.id}`), ORG_ID, item.id, vehicleIdByKey[item.vehicleKey],
        deterministicId(`user:${driverKey}`), deterministicId(`user:${guideKey}`), day(-5),
      ]);
    });
  }

  const customerRows = CUSTOMERS.map((customer, index) => [
    deterministicId(`customer:${index}`), ORG_ID, customer.name, customer.email, customer.phone, customer.nationality,
    index % 6 === 0 ? "Repeat customer — prefers small-group departures." : null, index % 3 === 0 ? "ONLINE" : "MANUAL",
    day(-200 + index * 4), now,
  ]);
  const customerIds = CUSTOMERS.map((_, index) => deterministicId(`customer:${index}`));

  const bookingRows = [];
  const paymentRows = [];
  const bookedCountByDeparture = new Map();
  const allUpcomingDepartures = [...departuresByTourId.values()].flat().filter((item) => item.status !== "CANCELLED" && item.offset >= 0);
  const allPastDepartures = [...departuresByTourId.values()].flat().filter((item) => item.status === "COMPLETED");
  const bookableDepartures = [...allUpcomingDepartures, ...allPastDepartures];
  let bookingIndex = 0;
  bookableDepartures.forEach((departure, index) => {
    const bookingsForThisDeparture = departure.offset >= 0 ? 2 : 1;
    for (let slot = 0; slot < bookingsForThisDeparture; slot++) {
      const customerId = customerIds[bookingIndex % customerIds.length];
      const paxCount = (bookingIndex % 4) + 1;
      const pricePerPax = 15000 + (bookingIndex % 5) * 4000;
      const totalPrice = pricePerPax * paxCount;
      const past = departure.offset < 0;
      const status = past ? "COMPLETED" : bookingIndex % 9 === 0 ? "PENDING" : "CONFIRMED";
      const paymentStatus = status === "PENDING" ? "UNPAID" : bookingIndex % 4 === 0 ? "PARTIAL" : "PAID";
      const createdAt = day(Math.max(departure.offset - 10, -29), 10 + (bookingIndex % 6));
      const bookingId = deterministicId(`booking:${bookingIndex}`);
      bookingRows.push([
        bookingId, ORG_ID, departure.id, customerId, paxCount, totalPrice, bookingIndex % 7 === 0 ? 10 : 0, "AMD",
        status, paymentStatus, bookingIndex % 3 === 0 ? "ONLINE" : "MANUAL",
        bookingIndex % 3 === 0 ? null : deterministicId("user:operator"),
        bookingIndex % 8 === 0 ? "Vegetarian meal requested." : null,
        `ararat-${bookingIndex + 1}`, createdAt, now,
      ]);
      if (status !== "CANCELLED") bookedCountByDeparture.set(departure.id, (bookedCountByDeparture.get(departure.id) || 0) + paxCount);
      if (paymentStatus !== "UNPAID") {
        paymentRows.push([
          deterministicId(`payment:${bookingIndex}`), ORG_ID, bookingId,
          paymentStatus === "PARTIAL" ? totalPrice / 2 : totalPrice, "AMD",
          bookingIndex % 3 === 0 ? "CARD_ONLINE" : bookingIndex % 3 === 1 ? "CASH" : "BANK_TRANSFER",
          "COMPLETED", `ARARAT-${bookingIndex + 1}`, deterministicId("user:operator"), createdAt, createdAt,
        ]);
      }
      bookingIndex += 1;
    }
  });

  await client.query("BEGIN");
  try {
    await seedGeography(client);
    await seedCategories(client);

    const requiredRegionCodes = [...new Set([...tourRegionCodesByTourId.values()].flat())];
    const regionResult = await client.query(`SELECT "id", "isoCode" FROM "Region" WHERE "isoCode" = ANY($1::text[])`, [requiredRegionCodes]);
    const regionIdByCode = new Map(regionResult.rows.map((row) => [row.isoCode, row.id]));
    const missingRegionCodes = requiredRegionCodes.filter((code) => !regionIdByCode.has(code));
    if (missingRegionCodes.length > 0) throw new Error(`Missing regions: ${missingRegionCodes.join(", ")}`);
    const tourRegionRows = [...tourRegionCodesByTourId.entries()].flatMap(([tourId, codes]) =>
      codes.map((code, position) => [tourId, regionIdByCode.get(code), position, now]),
    );

    const requiredCategorySlugs = [...new Set([...tourCategorySlugsByTourId.values()].flat())];
    const categoryResult = await client.query(`SELECT "id", "slug" FROM "Category" WHERE "slug" = ANY($1::text[])`, [requiredCategorySlugs]);
    const categoryIdBySlug = new Map(categoryResult.rows.map((row) => [row.slug, row.id]));
    const missingCategorySlugs = requiredCategorySlugs.filter((slug) => !categoryIdBySlug.has(slug));
    if (missingCategorySlugs.length > 0) throw new Error(`Missing categories: ${missingCategorySlugs.join(", ")}`);
    const tourCategoryRows = [...tourCategorySlugsByTourId.entries()].flatMap(([tourId, slugs]) =>
      slugs.map((slug, position) => [tourId, categoryIdBySlug.get(slug), position, now]),
    );

    for (const table of ["Payment", "Booking", "DepartureVehicle", "Departure", "Tour", "Vehicle", "Customer"]) {
      await client.query(`DELETE FROM ${quoteIdentifier(table)} WHERE "organizationId" = $1`, [ORG_ID]);
    }
    await client.query(`DELETE FROM "Organization" WHERE "id" = $1`, [ORG_ID]);
    await client.query(`DELETE FROM "User" WHERE "email" LIKE $1`, [`%@${DEMO_DOMAIN}`]);

    await insertRows(client, "User", ["id", "organizationId", "email", "passwordHash", "name", "phone", "roles", "status", "createdAt", "updatedAt"], [ownerRow]);
    await insertRows(client, "Organization", ["id", "ownerId", "name", "slug", "description", "logoUrl", "contactEmail", "contactPhone", "address", "language", "currency", "timezone", "isPublished", "createdAt", "updatedAt"], [organizationRow]);
    await client.query(`UPDATE "User" SET "organizationId" = $1, "updatedAt" = $2 WHERE "id" = $3`, [ORG_ID, now, OWNER_ID]);
    await insertRows(client, "User", ["id", "organizationId", "email", "passwordHash", "name", "phone", "roles", "status", "createdAt", "updatedAt"], staffRows);
    await insertRows(client, "Vehicle", ["id", "organizationId", "name", "type", "capacity", "licensePlate", "driverName", "driverPhone", "isActive", "createdAt", "updatedAt"], vehicleRows);
    await insertRows(client, "Tour", ["id", "organizationId", "title", "slug", "description", "durationDays", "languagesOffered", "images", "itinerary", "included", "excluded", "basePrice", "currency", "isPublished", "createdAt", "updatedAt", "deletedAt"], tourRows);
    await insertRows(client, "TourRegion", ["tourId", "regionId", "position", "createdAt"], tourRegionRows);
    await insertRows(client, "TourCategory", ["tourId", "categoryId", "position", "createdAt"], tourCategoryRows);
    await insertRows(client, "Departure", ["id", "organizationId", "tourId", "date", "returnAt", "capacity", "bookedCount", "priceOverride", "status", "notes", "createdAt", "updatedAt"], departureRows);
    await insertRows(client, "DepartureVehicle", ["id", "organizationId", "departureId", "vehicleId", "driverId", "guideId", "createdAt"], departureVehicleRows);
    await insertRows(client, "Customer", ["id", "organizationId", "fullName", "email", "phone", "nationality", "notes", "source", "createdAt", "updatedAt"], customerRows);
    await insertRows(client, "Booking", ["id", "organizationId", "departureId", "customerId", "paxCount", "totalPrice", "discountPercent", "currency", "status", "paymentStatus", "source", "createdByUserId", "specialRequests", "lookupToken", "createdAt", "updatedAt"], bookingRows);
    await insertRows(client, "Payment", ["id", "organizationId", "bookingId", "amount", "currency", "method", "status", "externalReference", "recordedByUserId", "paidAt", "createdAt"], paymentRows);

    for (const [departureId, bookedCount] of bookedCountByDeparture) {
      await client.query(`UPDATE "Departure" SET "bookedCount" = LEAST("capacity", $1), "updatedAt" = $2 WHERE "id" = $3`, [bookedCount, now, departureId]);
    }

    await client.query("COMMIT");

    console.log("\nArarat Trails marketing demo seeded successfully.\n");
    console.log(`Tours: ${tourRows.length}, Vehicles: ${vehicleRows.length}, Customers: ${customerRows.length}, Bookings: ${bookingRows.length}, Payments: ${paymentRows.length}\n`);
    console.log(`Owner login: owner@${DEMO_DOMAIN} / ${DEMO_PASSWORD}\n`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Marketing demo seed failed:", error);
  process.exit(1);
});
