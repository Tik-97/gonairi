import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSIONS,
  OWNER_PERMISSION_FLOOR,
  PERMISSION_GROUPS,
  ROLES,
  isBackOfficeRole,
} from "@/lib/auth/permissions";

describe("isBackOfficeRole", () => {
  it("is true for every role except DRIVER, GUIDE, and DRIVER_GUIDE", () => {
    expect(isBackOfficeRole("OWNER")).toBe(true);
    expect(isBackOfficeRole("ADMIN")).toBe(true);
    expect(isBackOfficeRole("OPERATOR")).toBe(true);
  });

  it("is false for DRIVER, GUIDE, and DRIVER_GUIDE — they only ever see their own schedule", () => {
    expect(isBackOfficeRole("DRIVER")).toBe(false);
    expect(isBackOfficeRole("GUIDE")).toBe(false);
    expect(isBackOfficeRole("DRIVER_GUIDE")).toBe(false);
  });
});

describe("ROLES", () => {
  it("lists exactly the 6 roles the schema defines, once each", () => {
    expect(new Set(ROLES).size).toBe(ROLES.length);
    expect(ROLES.sort()).toEqual(["ADMIN", "DRIVER", "DRIVER_GUIDE", "GUIDE", "OPERATOR", "OWNER"]);
  });
});

describe("PERMISSION_GROUPS", () => {
  it("covers every permission exactly once — the Super Admin UI must never silently drop or duplicate a permission", () => {
    const flattened = PERMISSION_GROUPS.flatMap((group) => group.permissions.map((p) => p.key));
    expect(flattened.sort()).toEqual([...ALL_PERMISSIONS].sort());
    expect(new Set(flattened).size).toBe(flattened.length);
  });

  it("gives every permission a non-empty human label", () => {
    for (const group of PERMISSION_GROUPS) {
      for (const permission of group.permissions) {
        expect(permission.label.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("OWNER_PERMISSION_FLOOR", () => {
  it("is a subset of the real permission set — a typo here would silently no-op the lockout guard", () => {
    for (const permission of OWNER_PERMISSION_FLOOR) {
      expect(ALL_PERMISSIONS).toContain(permission);
    }
  });

  it("is non-empty — an empty floor would defeat the purpose of having one", () => {
    expect(OWNER_PERMISSION_FLOOR.length).toBeGreaterThan(0);
  });
});
