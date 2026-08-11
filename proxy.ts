import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

// Single documented kill-switch for the public marketplace, so opening it
// later is a one-line env change instead of deleting a route-prefix list.
// Unset/anything other than "true" keeps it closed — today's behavior.
// Redundant with the isPublished checks already enforced in every marketplace
// query, so flipping this on is safe even before a deliberate "launch" pass.
const MARKETPLACE_ENABLED = process.env.MARKETPLACE_ENABLED === "true";

// Optimistic route protection only (reads the session cookie, no DB hit).
// Real authorization still happens in requireSession()/requireRole() close to the data.
export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  // A platform-admin session still carries a truthy session.user (email/name via
  // NextAuth defaults) but no organizationId — must not count as a tenant session,
  // or a Super Admin visiting /dashboard would bounce forever between it and /login.
  const isTenantSession = Boolean(session?.user?.organizationId);

  const isAdminLoginRoute = pathname === "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin") && !isAdminLoginRoute;
  const isPlatformAdminSession = Boolean(session?.platformAdmin);

  // The public marketplace (marketing homepage, tour browsing, guest booking) is
  // temporarily closed — only the back-office and its login/register are live.
  const isMarketplaceRoute =
    pathname === "/" ||
    pathname.startsWith("/tours") ||
    pathname.startsWith("/agencies") ||
    pathname.startsWith("/book/") ||
    pathname.startsWith("/bookings/");
  const isClosedMarketplaceRoute = isMarketplaceRoute && !MARKETPLACE_ENABLED;

  if (isClosedMarketplaceRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isDashboardRoute && !isTenantSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isTenantSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAdminRoute && !isPlatformAdminSession) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (isAdminLoginRoute && isPlatformAdminSession) {
    return NextResponse.redirect(new URL("/admin/roles", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
