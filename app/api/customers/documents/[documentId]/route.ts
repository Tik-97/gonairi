import { readFile } from "node:fs/promises";
import path from "node:path";
import { get } from "@vercel/blob";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";

const LOCAL_PREFIX = "local:customers/";
const LOCAL_ROOT = path.join(process.cwd(), "data", "customer-uploads");

function isInside(candidate: string, root: string): boolean {
  const relative = path.relative(root, candidate);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function downloadHeaders(name: string, mimeType: string | null): Record<string, string> {
  return {
    "Content-Type": mimeType || "application/octet-stream",
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const [{ documentId }, session] = await Promise.all([
    params,
    requirePermission(PERMISSIONS.customersView),
  ]);
  const document = await scopedPrisma(session.user.organizationId).customerDocument.findFirst({
    where: { id: documentId },
  });
  if (!document) return new Response("Not found", { status: 404 });

  if (document.url.startsWith(LOCAL_PREFIX)) {
    const expectedPrefix = `${LOCAL_PREFIX}${session.user.organizationId}/`;
    if (!document.url.startsWith(expectedPrefix)) return new Response("Not found", { status: 404 });
    const filePath = path.resolve(LOCAL_ROOT, document.url.slice(LOCAL_PREFIX.length));
    if (!isInside(filePath, LOCAL_ROOT)) return new Response("Not found", { status: 404 });
    try {
      return new Response(await readFile(filePath), { headers: downloadHeaders(document.name, document.mimeType) });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  }

  const blob = await get(document.url, { access: "private" });
  if (!blob?.stream) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  blob.headers.forEach((value, name) => headers.set(name, value));
  for (const [name, value] of Object.entries(downloadHeaders(document.name, document.mimeType))) {
    headers.set(name, value);
  }
  return new Response(blob.stream, { headers });
}
