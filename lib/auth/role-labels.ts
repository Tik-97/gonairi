import type { UserRole } from "@/generated/prisma/enums";

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: "Owner",
  OPERATOR: "Operator",
  DRIVER: "Driver",
  GUIDE: "Guide",
  DRIVER_GUIDE: "Driver-Guide",
};
