import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TENANT_SCOPED_MODELS } from "@/lib/db/scoped";

/**
 * Static regression guard for Architecture Audit finding P3-17: nothing previously
 * enforced that a newly added tenant-owned Prisma model actually gets added to
 * TENANT_SCOPED_MODELS. A forgotten entry means scopedPrisma() silently stops
 * scoping that model — the single highest-consequence bug class this app can have.
 *
 * This parses prisma/schema.prisma directly (not Prisma's generated DMMF) to avoid
 * coupling to generator internals — it only needs to know "which models declare an
 * organizationId field," which is a stable textual property of the schema file.
 */
function modelsWithOrganizationId(schemaSource: string): Set<string> {
  const modelBlockPattern = /model\s+(\w+)\s*\{([^}]*)\}/g;
  const modelsWithOrgId = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = modelBlockPattern.exec(schemaSource)) !== null) {
    const [, modelName, body] = match;
    if (/^\s*organizationId\s+String\b/m.test(body)) {
      modelsWithOrgId.add(modelName);
    }
  }
  return modelsWithOrgId;
}

describe("TENANT_SCOPED_MODELS", () => {
  const schemaPath = path.resolve(import.meta.dirname, "../../prisma/schema.prisma");
  const schemaSource = readFileSync(schemaPath, "utf-8");
  const expected = modelsWithOrganizationId(schemaSource);

  it("contains every model that declares an organizationId field in schema.prisma", () => {
    const missing = [...expected].filter((model) => !TENANT_SCOPED_MODELS.has(model));
    expect(missing, `these models have organizationId but are missing from TENANT_SCOPED_MODELS: ${missing.join(", ")}`).toEqual([]);
  });

  it("doesn't list a model that no longer has (or never had) an organizationId field", () => {
    const extra = [...TENANT_SCOPED_MODELS].filter((model) => !expected.has(model));
    expect(extra, `these models are in TENANT_SCOPED_MODELS but have no organizationId field: ${extra.join(", ")}`).toEqual([]);
  });

  it("sanity-checks the parser itself found a non-trivial number of models", () => {
    // Guards against the regex silently matching nothing if schema.prisma's format changes.
    expect(expected.size).toBeGreaterThan(5);
  });
});
