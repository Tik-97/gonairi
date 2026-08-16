import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSIONS,
  OWNER_PERMISSION_FLOOR,
  OWNER_ONLY_PERMISSIONS,
  PERMISSION_GROUPS,
  ROLES,
  isBackOfficeRole,
} from "@/lib/auth/permissions";

describe("isBackOfficeRole", () => {
  it("is true for every role except DRIVER, GUIDE, and DRIVER_GUIDE", () => {
    expect(isBackOfficeRole("OWNER")).toBe(true);
    expect(isBackOfficeRole("OPERATOR")).toBe(true);
  });

  it("is false for DRIVER, GUIDE, and DRIVER_GUIDE — they only ever see their own schedule", () => {
    expect(isBackOfficeRole("DRIVER")).toBe(false);
    expect(isBackOfficeRole("GUIDE")).toBe(false);
    expect(isBackOfficeRole("DRIVER_GUIDE")).toBe(false);
  });
});

describe("ROLES", () => {
  it("lists exactly the 5 agency roles the schema defines, once each", () => {
    expect(new Set(ROLES).size).toBe(ROLES.length);
    expect(ROLES.sort()).toEqual(["DRIVER", "DRIVER_GUIDE", "GUIDE", "OPERATOR", "OWNER"]);
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
  it("contains every permission so an Owner always controls their whole agency", () => {
    expect([...OWNER_PERMISSION_FLOOR].sort()).toEqual([...ALL_PERMISSIONS].sort());
  });
});

describe("OWNER_ONLY_PERMISSIONS", () => {
  it("keeps agency and staff administration exclusive to the Owner", () => {
    expect(OWNER_ONLY_PERMISSIONS).toEqual(new Set([
      "staff:manage",
      "attendance:manage",
      "org:settings-manage",
    ]));
  });
});
