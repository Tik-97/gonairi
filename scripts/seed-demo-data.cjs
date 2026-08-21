// Deterministic, repeatable demo dataset covering every database model and enum.
// Usage: npm run seed:demo
require("dotenv/config");

const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const { Client } = require("pg");
const { seedCategories } = require("./seed-categories.cjs");
const { seedGeography } = require("./seed-geography.cjs");

const DEMO_DOMAIN = "demo.gonairi.test";
const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD || "Demo123!";
const ORGANIZATION_COUNT = 18;
const ALL_PERMISSIONS = [
  "tours:view", "tours:manage", "tours:delete", "departures:manage", "departures:delete",
  "bookings:view", "bookings:manage", "customers:view", "customers:manage", "customers:delete",
  "vehicles:view", "vehicles:manage", "vehicles:delete", "staff:view", "staff:manage",
  "attendance:manage", "finances:view", "finances:manage", "schedule:view-own", "org:settings-manage",
];

function deterministicId(key) {
  const hex = crypto.createHash("sha256").update(`gonairi-demo:${key}`).digest("hex").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function day(offset, hour = 9) {
  const value = new Date();
  value.setUTCHours(hour, 0, 0, 0);
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

function ownerEmail(index) {
  if (index === 0) return `owner@${DEMO_DOMAIN}`;
  if (index === 1) return `owner.caucasus@${DEMO_DOMAIN}`;
  return `owner${String(index + 1).padStart(2, "0")}@${DEMO_DOMAIN}`;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing. Add it to .env before seeding.");
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error("Demo seeding is disabled in production. Set ALLOW_DEMO_SEED=true only if intentional.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = new Date();
  const organizationIds = Array.from({ length: ORGANIZATION_COUNT }, (_, index) => deterministicId(`organization:${index}`));
  const ownerIds = Array.from({ length: ORGANIZATION_COUNT }, (_, index) => deterministicId(`owner:${index}`));

  const ownerRows = ownerIds.map((id, index) => [
    id, null, ownerEmail(index), passwordHash,
    index === 0 ? "Ani Demo Owner" : index === 1 ? "Aram Caucasus Owner" : `Demo Owner ${String(index + 1).padStart(2, "0")}`,
    `+374 91 ${String(110000 + index).slice(-6)}`, ["OWNER"], "ACTIVE", day(-120 + index), now,
  ]);
  const organizationRows = organizationIds.map((id, index) => {
    const number = String(index + 1).padStart(2, "0");
    return [
      id, ownerIds[index],
      index === 0 ? "Armenia Explorer Demo" : index === 1 ? "Caucasus Trails Demo" : `Demo Travel Agency ${number}`,
      index === 0 ? "demo-armenia-explorer" : index === 1 ? "demo-caucasus-trails" : `demo-agency-${number}`,
      index === 0
        ? "Full-featured demo agency for CRM, scheduling, finance, fleet, public marketplace, and pagination testing."
        : "Generated agency for platform administration and tenant-isolation testing.",
      null, `contact${index + 1}@${DEMO_DOMAIN}`, `+374 10 ${String(220000 + index).slice(-6)}`,
      index % 2 === 0 ? "Yerevan, Armenia" : "Gyumri, Armenia", index % 3 === 0 ? "hy" : "en",
      index === 1 ? "USD" : index === 2 ? "EUR" : "AMD", "Asia/Yerevan",
      index < 2 || index % 3 !== 0, day(-110 + index), now,
    ];
  });

  const primaryStaffSpecs = [
    ["operator", "Mariam Demo Operator", ["OPERATOR"], "ACTIVE"],
    ["driver", "Gor Demo Driver", ["DRIVER"], "ACTIVE"],
    ["guide", "Lilit Demo Guide", ["GUIDE"], "ACTIVE"],
    ["driver-guide", "Hayk Demo Driver Guide", ["DRIVER_GUIDE"], "ACTIVE"],
    ["multi-role", "Narek Demo Multi Role", ["OPERATOR", "DRIVER", "GUIDE"], "ACTIVE"],
    ["invited", "Sona Invited", ["GUIDE"], "INVITED"],
    ["disabled", "Vahan Disabled", ["DRIVER"], "DISABLED"],
    ...Array.from({ length: 12 }, (_, index) => [
      `staff-${index + 1}`, `Demo Staff ${String(index + 1).padStart(2, "0")}`,
      index % 3 === 0 ? ["OPERATOR"] : index % 3 === 1 ? ["DRIVER"] : ["GUIDE"], "ACTIVE",
    ]),
  ];
  const secondaryStaffSpecs = [
    ["operator-caucasus", "Tatev Caucasus Operator", ["OPERATOR"], "ACTIVE"],
    ["driver-caucasus", "Levon Caucasus Driver", ["DRIVER"], "ACTIVE"],
    ["guide-caucasus", "Mane Caucasus Guide", ["GUIDE"], "ACTIVE"],
    ["driver-guide-caucasus", "Karen Caucasus Driver Guide", ["DRIVER_GUIDE"], "ACTIVE"],
    ["disabled-caucasus", "Nune Caucasus Disabled", ["OPERATOR"], "DISABLED"],
  ];
  function usersFor(organizationIndex, specs) {
    return specs.map(([key, name, roles, status], index) => [
      deterministicId(`user:${key}`), organizationIds[organizationIndex], `${key}@${DEMO_DOMAIN}`,
      passwordHash, name, `+374 95 ${String(330000 + organizationIndex * 100 + index).slice(-6)}`,
      roles, status, day(-90 + index), now,
    ]);
  }
  const staffRows = [...usersFor(0, primaryStaffSpecs), ...usersFor(1, secondaryStaffSpecs)];

  const vehicleRows = [];
  const vehicleIdsByOrganization = new Map();
  for (const [organizationIndex, count] of [[0, 18], [1, 7]]) {
    const ids = [];
    for (let index = 0; index < count; index++) {
      const id = deterministicId(`vehicle:${organizationIndex}:${index}`);
      ids.push(id);
      const type = ["Jeep", "Minivan", "Bus", "Car"][index % 4];
      vehicleRows.push([
        id, organizationIds[organizationIndex], `${type} ${String(index + 1).padStart(2, "0")}`, type,
        type === "Bus" ? 28 : type === "Minivan" ? 12 : type === "Jeep" ? 4 : 3,
        `DEMO-${organizationIndex + 1}${String(index + 1).padStart(2, "0")}`,
        index % 4 === 0 ? `Contract Driver ${index + 1}` : null,
        index % 4 === 0 ? `+374 99 ${String(440000 + index).slice(-6)}` : null,
        index % 7 !== 6, day(-80 + index), now,
      ]);
    }
    vehicleIdsByOrganization.set(organizationIndex, ids);
  }

  const categoryGroups = [
    ["cultural", "history"],
    ["adventure", "hiking"],
    ["food", "culinary"],
    ["nature", "photography"],
    ["history", "religious"],
    ["family", "day-trip"],
  ];
  const armenianRegionCodes = ["AM-ER", "AM-LO", "AM-SU", "AM-VD", "AM-GR", "AM-SH"];
  const caucasusRegionGroups = [
    ["AM-LO", "GE-TB"],
    ["GE-KA"],
    ["AM-SH", "GE-SJ"],
    ["GE-IM", "GE-SZ"],
  ];
  const tourRows = [];
  const toursByOrganization = new Map();
  const tourRegionCodesByTourId = new Map();
  const tourCategorySlugsByTourId = new Map();
  function addTours(organizationIndex, count) {
    const ids = [];
    for (let index = 0; index < count; index++) {
      const id = deterministicId(`tour:${organizationIndex}:${index}`);
      ids.push(id);
      const primary = organizationIndex === 0;
      const deleted = primary && index === count - 1;
      const published = !deleted && (primary ? index % 6 !== 5 : index % 4 !== 3);
      const regionCodes = organizationIndex === 1
        ? caucasusRegionGroups[index % caucasusRegionGroups.length]
        : [armenianRegionCodes[index % armenianRegionCodes.length]];
      const categorySlugs = categoryGroups[index % categoryGroups.length];
      tourRegionCodesByTourId.set(id, regionCodes);
      tourCategorySlugsByTourId.set(id, categorySlugs);
      tourRows.push([
        id, organizationIds[organizationIndex],
        primary ? `Armenian Experience ${String(index + 1).padStart(2, "0")}` : organizationIndex === 1 ? `Caucasus Journey ${String(index + 1).padStart(2, "0")}` : `Demo Day Tour ${String(organizationIndex + 1).padStart(2, "0")}`,
        `demo-tour-${organizationIndex + 1}-${index + 1}`,
        `Generated ${categorySlugs[0]} itinerary covering pricing, publishing, scheduling, and booking scenarios.`,
        (index % 4) + 1,
        index % 3 === 0 ? ["hy", "en", "ru"] : ["hy", "en"],
        index % 5 === 0 ? ["https://images.unsplash.com/photo-1566438480900-0609be27a4be?auto=format&fit=crop&w=1200&q=80"] : [],
        JSON.stringify([{ day: 1, title: "Arrival and orientation" }, { day: 2, title: "Guided exploration" }]),
        "Licensed guide, transportation, bottled water", "Meals, personal expenses, travel insurance",
        organizationIndex === 1 ? 95 + index * 8 : 18000 + index * 2500,
        organizationIndex === 1 ? "USD" : "AMD", published, day(-70 + index), now, deleted ? day(-2) : null,
      ]);
    }
    toursByOrganization.set(organizationIndex, ids);
  }
  addTours(0, 22);
  addTours(1, 8);
  for (let index = 2; index < ORGANIZATION_COUNT; index++) addTours(index, 1);

  const departureRows = [];
  const departuresByOrganization = new Map();
  function addDeparture(organizationIndex, tourId, key, offset, index) {
    const id = deterministicId(`departure:${key}`);
    const past = offset < 0;
    const status = past
      ? index % 7 === 0 ? "CANCELLED" : "COMPLETED"
      : index % 11 === 0 ? "CANCELLED" : index % 2 === 0 ? "CONFIRMED" : "SCHEDULED";
    departureRows.push([
      id, organizationIds[organizationIndex], tourId, day(offset, 8 + index % 4),
      index % 5 === 0 ? null : day(offset, 16 + index % 3), 30, 0,
      index % 4 === 0 ? (organizationIndex === 1 ? 125 : 24000) : null, status,
      index % 6 === 0 ? "Demo note: confirm pickup details one day before departure." : null,
      day(Math.min(offset - 20, -1)), now,
    ]);
    const items = departuresByOrganization.get(organizationIndex) || [];
    items.push({ id, status, tourId, offset });
    departuresByOrganization.set(organizationIndex, items);
  }
  const primaryTours = toursByOrganization.get(0);
  for (let index = 0; index < 25; index++) addDeparture(0, primaryTours[0], `primary-feature:${index}`, index - 3, index);
  for (let index = 1; index < primaryTours.length - 1; index++) {
    addDeparture(0, primaryTours[index], `primary:${index}:past`, -(index + 2), index);
    addDeparture(0, primaryTours[index], `primary:${index}:future`, index + 2, index + 1);
  }
  const secondaryTours = toursByOrganization.get(1);
  secondaryTours.forEach((tourId, index) => {
    addDeparture(1, tourId, `secondary:${index}:past`, -(index + 2), index);
    addDeparture(1, tourId, `secondary:${index}:future`, index + 3, index + 1);
  });

  const departureVehicleRows = [];
  for (const [organizationIndex, departures] of departuresByOrganization.entries()) {
    const vehicleIds = vehicleIdsByOrganization.get(organizationIndex);
    departures.filter((item) => item.status !== "CANCELLED").forEach((item, index) => {
      const primaryFeature = organizationIndex === 0 && item.tourId === primaryTours[0];
      departureVehicleRows.push([
        deterministicId(`departure-vehicle:${item.id}:0`), organizationIds[organizationIndex], item.id,
        primaryFeature ? vehicleIds[0] : index % 9 === 0 ? null : vehicleIds[index % vehicleIds.length],
        deterministicId(organizationIndex === 0 ? (index % 5 === 0 ? "user:driver-guide" : "user:driver") : "user:driver-caucasus"),
        deterministicId(organizationIndex === 0 ? (index % 5 === 0 ? "user:driver-guide" : "user:guide") : "user:guide-caucasus"),
        day(Math.min(item.offset - 10, -1)),
      ]);
      if (organizationIndex === 0 && index % 6 === 0) {
        departureVehicleRows.push([
          deterministicId(`departure-vehicle:${item.id}:1`), organizationIds[0], item.id, vehicleIds[1],
          deterministicId("user:driver-guide"), deterministicId("user:guide"), day(Math.min(item.offset - 9, -1)),
        ]);
      }
    });
  }

  const customerRows = [];
  const customersByOrganization = new Map();
  const customerNames = ["Emma Wilson", "David Kim", "Sofia Rossi", "Noah Martin", "Mia Schneider", "Liam Brown", "Olivia Garcia", "Ethan Miller", "Amelia Taylor", "Lucas Anderson", "Isabella Thomas", "Mateo Martinez"];
  function addCustomers(organizationIndex, count) {
    const ids = [];
    for (let index = 0; index < count; index++) {
      const id = deterministicId(`customer:${organizationIndex}:${index}`);
      ids.push(id);
      customerRows.push([
        id, organizationIds[organizationIndex], `${customerNames[index % customerNames.length]} ${Math.floor(index / customerNames.length) + 1}`,
        index % 7 === 0 ? null : `traveler${organizationIndex + 1}.${index + 1}@example.test`,
        index % 6 === 0 ? null : `+374 77 ${String(550000 + organizationIndex * 100 + index).slice(-6)}`,
        ["Armenian", "American", "Italian", "German", "French", "Japanese"][index % 6],
        index % 8 === 0 ? "Vegetarian meal requested; prefers morning departures." : null,
        index % 2 === 0 ? "MANUAL" : "ONLINE", day(-60 + index), now,
      ]);
    }
    customersByOrganization.set(organizationIndex, ids);
  }
  addCustomers(0, 24);
  addCustomers(1, 10);
  for (let index = 2; index < ORGANIZATION_COUNT; index++) addCustomers(index, 1);

  const bookingRows = [];
  const travelerRows = [];
  const paymentRows = [];
  const bookedCountByDeparture = new Map();
  const bookingStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];
  const paymentStatuses = ["UNPAID", "PARTIAL", "PAID", "REFUNDED"];
  const methods = ["CASH", "BANK_TRANSFER", "CARD_ONLINE", "OTHER"];
  function addBookings(organizationIndex, count) {
    const customers = customersByOrganization.get(organizationIndex);
    const departures = departuresByOrganization.get(organizationIndex).filter((item) => item.status !== "CANCELLED");
    for (let index = 0; index < count; index++) {
      const id = deterministicId(`booking:${organizationIndex}:${index}`);
      const departure = departures[index % departures.length];
      const customerId = organizationIndex === 0 && index < 18 ? customers[0] : customers[index % customers.length];
      const status = bookingStatuses[index % bookingStatuses.length];
      const paymentStatus = paymentStatuses[index % paymentStatuses.length];
      const source = index % 2 === 0 ? "MANUAL" : "ONLINE";
      const paxCount = index % 4 + 1;
      const currency = organizationIndex === 1 ? "USD" : "AMD";
      const totalPrice = (organizationIndex === 1 ? 110 : 22000) * paxCount * (index % 6 === 0 ? 0.9 : 1);
      const createdAt = day(-(index % 45), 12);
      bookingRows.push([
        id, organizationIds[organizationIndex], departure.id, customerId, paxCount, totalPrice,
        index % 6 === 0 ? 10 : 0, currency, status, paymentStatus, source,
        source === "MANUAL" ? deterministicId(organizationIndex === 0 ? "user:operator" : "user:operator-caucasus") : null,
        index % 9 === 0 ? "Window seat requested; call before pickup." : null,
        `demo-booking-${organizationIndex + 1}-${index + 1}`, createdAt, now,
      ]);
      if (status !== "CANCELLED") bookedCountByDeparture.set(departure.id, (bookedCountByDeparture.get(departure.id) || 0) + paxCount);
      for (let travelerIndex = 1; travelerIndex < paxCount; travelerIndex++) {
        travelerRows.push([
          deterministicId(`traveler:${organizationIndex}:${index}:${travelerIndex}`), organizationIds[organizationIndex], id,
          `Additional Traveler ${index + 1}.${travelerIndex}`, travelerIndex % 2 === 0,
          ["FULL", "HALF", "FREE"][travelerIndex % 3], createdAt,
        ]);
      }
      const paymentStatusRecord = paymentStatus === "PARTIAL" || paymentStatus === "PAID"
        ? "COMPLETED" : paymentStatus === "REFUNDED" ? "REFUNDED" : index % 8 === 0 ? "FAILED" : "PENDING";
      const amount = paymentStatus === "PARTIAL" ? totalPrice / 2 : totalPrice;
      paymentRows.push([
        deterministicId(`payment:${organizationIndex}:${index}:0`), organizationIds[organizationIndex], id,
        amount, currency, methods[index % methods.length], paymentStatusRecord, `DEMO-${paymentStatusRecord}-${index + 1}`,
        source === "MANUAL" ? deterministicId(organizationIndex === 0 ? "user:operator" : "user:operator-caucasus") : null,
        createdAt, createdAt,
      ]);
    }
  }
  addBookings(0, 42);
  addBookings(1, 18);

  const attendanceRows = [];
  const attendanceUsers = [ownerIds[0], ...primaryStaffSpecs.map(([key]) => deterministicId(`user:${key}`))];
  attendanceUsers.forEach((userId, userIndex) => {
    for (let offset = -30; offset <= 0; offset++) {
      const date = day(offset, 0);
      if (date.getUTCDay() === 0) continue;
      const absent = (offset + userIndex) % 11 === 0;
      attendanceRows.push([
        deterministicId(`attendance:${userId}:${date.toISOString().slice(0, 10)}`), organizationIds[0], userId,
        date, absent ? "ABSENT" : "WORKED", absent ? "Demo absence record" : null, date, now,
      ]);
    }
  });

  await client.query("BEGIN");
  try {
    const geography = await seedGeography(client);
    const categorySeed = await seedCategories(client);
    const requiredRegionCodes = [...new Set([...tourRegionCodesByTourId.values()].flat())];
    const regionResult = await client.query(
      `SELECT "id", "isoCode" FROM "Region" WHERE "isoCode" = ANY($1::text[])`,
      [requiredRegionCodes],
    );
    const regionIdByCode = new Map(regionResult.rows.map((row) => [row.isoCode, row.id]));
    const missingRegionCodes = requiredRegionCodes.filter((code) => !regionIdByCode.has(code));
    if (missingRegionCodes.length > 0) {
      throw new Error(`Geography seed is missing required regions: ${missingRegionCodes.join(", ")}`);
    }
    const tourRegionRows = [...tourRegionCodesByTourId.entries()].flatMap(([tourId, regionCodes]) =>
      regionCodes.map((code, position) => [tourId, regionIdByCode.get(code), position, now]),
    );
    const requiredCategorySlugs = [...new Set([...tourCategorySlugsByTourId.values()].flat())];
    const categoryResult = await client.query(
      `SELECT "id", "slug" FROM "Category" WHERE "slug" = ANY($1::text[])`,
      [requiredCategorySlugs],
    );
    const categoryIdBySlug = new Map(categoryResult.rows.map((row) => [row.slug, row.id]));
    const missingCategorySlugs = requiredCategorySlugs.filter((slug) => !categoryIdBySlug.has(slug));
    if (missingCategorySlugs.length > 0) {
      throw new Error(`Category seed is missing required hashtags: ${missingCategorySlugs.join(", ")}`);
    }
    const tourCategoryRows = [...tourCategorySlugsByTourId.entries()].flatMap(([tourId, categorySlugs]) =>
      categorySlugs.map((slug, position) => [tourId, categoryIdBySlug.get(slug), position, now]),
    );

    for (const table of ["BookingTraveler", "Payment", "Booking", "DepartureVehicle", "Attendance", "Departure", "Tour", "Vehicle", "Customer"]) {
      await client.query(`DELETE FROM ${quoteIdentifier(table)} WHERE "organizationId" = ANY($1::text[])`, [organizationIds]);
    }
    await client.query(`DELETE FROM "Organization" WHERE "id" = ANY($1::text[])`, [organizationIds]);
    await client.query(`DELETE FROM "User" WHERE "email" LIKE $1`, [`%@${DEMO_DOMAIN}`]);

    await insertRows(client, "User", ["id", "organizationId", "email", "passwordHash", "name", "phone", "roles", "status", "createdAt", "updatedAt"], ownerRows);
    await insertRows(client, "Organization", ["id", "ownerId", "name", "slug", "description", "logoUrl", "contactEmail", "contactPhone", "address", "language", "currency", "timezone", "isPublished", "createdAt", "updatedAt"], organizationRows);
    for (let index = 0; index < ORGANIZATION_COUNT; index++) {
      await client.query(`UPDATE "User" SET "organizationId" = $1, "updatedAt" = $2 WHERE "id" = $3`, [organizationIds[index], now, ownerIds[index]]);
    }
    await insertRows(client, "User", ["id", "organizationId", "email", "passwordHash", "name", "phone", "roles", "status", "createdAt", "updatedAt"], staffRows);
    await insertRows(client, "Vehicle", ["id", "organizationId", "name", "type", "capacity", "licensePlate", "driverName", "driverPhone", "isActive", "createdAt", "updatedAt"], vehicleRows);
    await insertRows(client, "Tour", ["id", "organizationId", "title", "slug", "description", "durationDays", "languagesOffered", "images", "itinerary", "included", "excluded", "basePrice", "currency", "isPublished", "createdAt", "updatedAt", "deletedAt"], tourRows);
    await insertRows(client, "TourRegion", ["tourId", "regionId", "position", "createdAt"], tourRegionRows);
    await insertRows(client, "TourCategory", ["tourId", "categoryId", "position", "createdAt"], tourCategoryRows);
    await insertRows(client, "Departure", ["id", "organizationId", "tourId", "date", "returnAt", "capacity", "bookedCount", "priceOverride", "status", "notes", "createdAt", "updatedAt"], departureRows);
    await insertRows(client, "DepartureVehicle", ["id", "organizationId", "departureId", "vehicleId", "driverId", "guideId", "createdAt"], departureVehicleRows);
    await insertRows(client, "Customer", ["id", "organizationId", "fullName", "email", "phone", "nationality", "notes", "source", "createdAt", "updatedAt"], customerRows);
    await insertRows(client, "Booking", ["id", "organizationId", "departureId", "customerId", "paxCount", "totalPrice", "discountPercent", "currency", "status", "paymentStatus", "source", "createdByUserId", "specialRequests", "lookupToken", "createdAt", "updatedAt"], bookingRows);
    await insertRows(client, "BookingTraveler", ["id", "organizationId", "bookingId", "fullName", "isChild", "priceType", "createdAt"], travelerRows);
    await insertRows(client, "Payment", ["id", "organizationId", "bookingId", "amount", "currency", "method", "status", "externalReference", "recordedByUserId", "paidAt", "createdAt"], paymentRows);
    await insertRows(client, "Attendance", ["id", "organizationId", "userId", "date", "status", "note", "createdAt", "updatedAt"], attendanceRows);
    for (const [departureId, bookedCount] of bookedCountByDeparture) {
      await client.query(`UPDATE "Departure" SET "bookedCount" = LEAST("capacity", $1), "updatedAt" = $2 WHERE "id" = $3`, [bookedCount, now, departureId]);
    }

    const permissionCount = Number((await client.query(`SELECT COUNT(*)::int AS count FROM "RolePermission"`)).rows[0].count);
    if (permissionCount === 0) {
      const permissionRows = [];
      for (const permission of ALL_PERMISSIONS) permissionRows.push([deterministicId(`permission:OWNER:${permission}`), "OWNER", permission, now]);
      const operatorDenied = ["tours:delete", "departures:delete", "customers:delete", "vehicles:delete", "staff:manage", "attendance:manage", "org:settings-manage"];
      for (const permission of ALL_PERMISSIONS.filter((value) => !operatorDenied.includes(value))) {
        permissionRows.push([deterministicId(`permission:OPERATOR:${permission}`), "OPERATOR", permission, now]);
      }
      for (const role of ["DRIVER", "GUIDE", "DRIVER_GUIDE"]) {
        permissionRows.push([deterministicId(`permission:${role}:schedule:view-own`), role, "schedule:view-own", now]);
      }
      await insertRows(client, "RolePermission", ["id", "role", "permission", "createdAt"], permissionRows);
    }

    await client.query("COMMIT");

    console.log("\nGoNairi demo data seeded successfully.\n");
    console.log(`Organizations: ${organizationRows.length}`);
    console.log(`Users: ${ownerRows.length + staffRows.length}`);
    console.log(`Tours: ${tourRows.length}`);
    console.log(`Tour regions: ${tourRegionRows.length}`);
    console.log(`Tour hashtags: ${tourCategoryRows.length}`);
    console.log(`Geography: ${geography.countryCount} countries, ${geography.regionCount} regions`);
    console.log(`Categories: ${categorySeed.categoryCount} hashtags`);
    console.log(`Departures: ${departureRows.length}`);
    console.log(`Vehicles: ${vehicleRows.length}`);
    console.log(`Customers: ${customerRows.length}`);
    console.log(`Bookings: ${bookingRows.length}`);
    console.log(`Travelers: ${travelerRows.length}`);
    console.log(`Payments: ${paymentRows.length}`);
    console.log(`Attendance records: ${attendanceRows.length}\n`);
    console.log(`Demo agency-user password: ${DEMO_PASSWORD}`);
    console.log(`Owner: owner@${DEMO_DOMAIN}`);
    console.log(`Operator: operator@${DEMO_DOMAIN}`);
    console.log(`Driver: driver@${DEMO_DOMAIN}`);
    console.log(`Guide: guide@${DEMO_DOMAIN}`);
    console.log(`Driver + Guide: driver-guide@${DEMO_DOMAIN}`);
    console.log(`Multi-role: multi-role@${DEMO_DOMAIN}\n`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Demo seed failed:", error);
  process.exit(1);
});
