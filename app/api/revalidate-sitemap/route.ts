import { revalidatePath } from "next/cache";

// On-demand refresh for /sitemap.xml — a companion to its own hourly
// `revalidate`, for when a change (new published tour/agency) should show up
// immediately rather than waiting for the next hourly window. Called by a
// server cron job or right after publish actions; never exposed to the
// browser, so it's a shared-secret header rather than a session check.
export async function POST(request: Request) {
  const secret = request.headers.get("x-revalidate-secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidatePath("/sitemap.xml");
  return Response.json({ revalidated: true, now: Date.now() });
}
