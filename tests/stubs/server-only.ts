// Test-only stand-in for the `server-only` package (see vitest.config.ts) — that
// package throws unconditionally when resolved outside a Next.js "react-server"
// bundle, which Vitest is not. Importing this file does nothing.
export {};
