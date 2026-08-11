"use server";

import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopedPrisma } from "@/lib/db/scoped";
import type { AttendanceStatus } from "@/generated/prisma/enums";

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function redirectToMonth(userId: string, date: string): never {
  const month = date.slice(0, 7);
  redirect(`/dashboard/staff/${userId}/attendance?month=${month}`);
}

export async function setAttendance(userId: string, date: string, status: AttendanceStatus): Promise<void> {
  const session = await requirePermission(PERMISSIONS.attendanceManage);
  const db = scopedPrisma(session.user.organizationId);

  const member = await db.user.findFirst({ where: { id: userId } });
  if (member) {
    await db.attendance.upsert({
      where: { userId_date: { userId, date: parseDateOnly(date) } },
      create: { organizationId: session.user.organizationId, userId, date: parseDateOnly(date), status },
      update: { status },
    });
  }

  redirectToMonth(userId, date);
}

export async function clearAttendance(userId: string, date: string): Promise<void> {
  const session = await requirePermission(PERMISSIONS.attendanceManage);
  const db = scopedPrisma(session.user.organizationId);

  await db.attendance.deleteMany({ where: { userId, date: parseDateOnly(date) } });
  redirectToMonth(userId, date);
}
