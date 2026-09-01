import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

// Single documented kill-switch for the public marketplace, so opening it
// later is a one-line env change instead of deleting a route-prefix list.
// Unset/anything other than "true" keeps it closed — today's behavior.
// Redundant with the isPublished checks already enforced in every marketplace
// query, so flipping this on is safe even before a deliberate "launch" pass.
const MARKETPLACE_ENABLED = process.env.MARKETPLACE_ENABLED === "true";

// SaaS marketing site + public marketplace (gonairi.com apex) vs. the
// private back office (crm.gonairi.com). Only these path prefixes redirect
// away from the apex domain — everything else (marketing pages, and the
// customer-facing marketplace: /tours, /agencies, /book, /bookings) is public
// and stays on gonairi.com, where it's crawlable. crm.gonairi.com is fully
// noindex'd (see robots.ts) since it's authenticated staff tooling only.
const CRM_HOST = "crm.gonairi.com";
const APEX_HOSTS = new Set(["gonairi.com", "www.gonairi.com"]);
const CRM_ONLY_PREFIXES = ["/dashboard", "/admin", "/login", "/register", "/select-role"];

function isCrmOnlyPath(pathname: string): boolean {
  return CRM_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

// Optimistic route protection only (reads the session cookie, no DB hit).
// Real authorization still happens in requireSession()/requireRole() close to the data.
export async function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const { pathname, search } = request.nextUrl;

  if (APEX_HOSTS.has(host) && isCrmOnlyPath(pathname)) {
    return NextResponse.redirect(`https://${CRM_HOST}${pathname}${search}`, 307);
  }
  if (host === CRM_HOST && pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await auth();

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isLoginRoute = pathname === "/login";
  const isRoleRoute = pathname === "/select-role";
  const isTenantSession = Boolean(session?.user?.organizationId);

  const isAdminRoute = pathname.startsWith("/admin");
  const isPlatformAdminSession = Boolean(session?.platformAdmin);

  // The public marketplace (tour browsing, guest booking) is temporarily
  // closed — only the back-office, authentication, and marketing routes are live.
  const isMarketplaceRoute =
    pathname.startsWith("/tours") ||
    pathname.startsWith("/agencies") ||
    pathname.startsWith("/book/") ||
    pathname.startsWith("/bookings/");
  const isClosedMarketplaceRoute = isMarketplaceRoute && !MARKETPLACE_ENABLED;

  if (isClosedMarketplaceRoute) {
    return APEX_HOSTS.has(host)
      ? NextResponse.redirect(`https://${CRM_HOST}/login`)
      : NextResponse.redirect(new URL("/login", request.url));
  }

  if (isDashboardRoute && !isTenantSession && !isPlatformAdminSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && (isTenantSession || isPlatformAdminSession)) {
    return NextResponse.redirect(new URL(isPlatformAdminSession ? "/admin/overview" : "/select-role", request.url));
  }

  if (isRoleRoute && isPlatformAdminSession) {
    return NextResponse.redirect(new URL("/admin/overview", request.url));
  }

  if (isAdminRoute && !isPlatformAdminSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
