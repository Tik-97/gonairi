"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { put, del } from "@vercel/blob";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const LOCAL_UPLOAD_PREFIX = "/uploads/tours/";
const LOCAL_UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "tours");

/** True if `candidate` is `root` itself or a path strictly inside it, after resolving
 *  `..`/symlink-shaped segments — the actual containment check, not just a string prefix. */
function isInsideDirectory(candidate: string, root: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

/**
 * No BLOB_READ_WRITE_TOKEN configured (e.g. local dev before a Vercel Blob
 * store is set up) → write straight to /public/uploads so uploads are free
 * and instant to preview. Only works locally: Vercel's serverless filesystem
 * is read-only/ephemeral, so this path never runs in production once the
 * token is set — real deploys automatically use Vercel Blob instead.
 */
async function saveLocally(file: File, organizationId: string, extension: string): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", "tours", organizationId);
  await mkdir(dir, { recursive: true });
  const filename = `${crypto.randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);
  return `${LOCAL_UPLOAD_PREFIX}${organizationId}/${filename}`;
}

export async function uploadTourImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const session = await requirePermission(PERMISSIONS.toursManage);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file provided." };
  }
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return { error: "Please upload a JPEG, PNG, WebP, or GIF image." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "Image must be under 5MB." };
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      const url = await saveLocally(file, session.user.organizationId, extension);
      return { url };
    }
    const pathname = `tours/${session.user.organizationId}/${crypto.randomUUID()}.${extension}`;
    const blob = await put(pathname, file, { access: "public" });
    return { url: blob.url };
  } catch {
    return { error: "Upload failed. Please try again." };
  }
}

/** Best-effort cleanup when a user removes an image before/after saving the tour. */
export async function deleteTourImage(url: string): Promise<void> {
  await requirePermission(PERMISSIONS.toursManage);
  try {
    if (url.includes(".blob.vercel-storage.com/")) {
      await del(url);
    } else if (url.startsWith(LOCAL_UPLOAD_PREFIX)) {
      // `url` is caller-supplied — resolve it and confirm it still lands inside the
      // uploads directory before unlinking, so a crafted `../` segment can't delete
      // files elsewhere on disk (e.g. another organization's upload, or outside /public).
      const resolvedPath = path.resolve(path.join(process.cwd(), "public", url));
      if (isInsideDirectory(resolvedPath, LOCAL_UPLOAD_ROOT)) {
        await unlink(resolvedPath);
      }
    }
  } catch {
    // Non-critical: an orphaned file doesn't break anything, so we don't surface this.
  }
}
