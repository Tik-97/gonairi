import { defineConfig } from "vitest/config";
import path from "node:path";

const rootDir = import.meta.dirname;

// `server-only` throws unconditionally unless resolved under Next's "react-server"
// bundler condition (see node_modules/server-only/package.json) — Vitest runs in
// plain Node, so it's aliased to a no-op stub here rather than flipping a global
// resolve condition, which would also change how React itself resolves.
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.next/**", "**/generated/**"],
  },
  resolve: {
    alias: [
      { find: "server-only", replacement: path.resolve(rootDir, "tests/stubs/server-only.ts") },
      { find: "@", replacement: path.resolve(rootDir) },
    ],
  },
});
