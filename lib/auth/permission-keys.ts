/**
 * The fixed set of permission keys the app code checks against — safe to
 * import from client components (e.g. to filter nav items), unlike
 * lib/auth/permissions.ts which is server-only (it queries the database for
 * which roles currently hold which of these keys).
 */
export const PERMISSIONS = {
  // Tours
  toursView: "tours:view",
  toursManage: "tours:manage", // create + edit
  toursDelete: "tours:delete",

  // Departures (schedule instances of a tour)
  departuresManage: "departures:manage", // create, cancel, assign vehicle/driver/guide

  // Bookings
  bookingsView: "bookings:view",
  bookingsManage: "bookings:manage", // create manually, change status/payment

  // Customers (CRM)
  customersView: "customers:view",
  customersManage: "customers:manage",
  customersDelete: "customers:delete",

  // Fleet
  vehiclesView: "vehicles:view",
  vehiclesManage: "vehicles:manage",

  // Team
  staffView: "staff:view",
  staffManage: "staff:manage", // create/edit/disable other staff
  attendanceManage: "attendance:manage", // mark other staff's attendance

  // Own schedule — every assignable role (driver/guide) can see their own
  // upcoming departures regardless of anything else they can't access.
  scheduleViewOwn: "schedule:view-own",

  // Agency-wide settings (branding, public marketplace listing)
  orgSettingsManage: "org:settings-manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);
