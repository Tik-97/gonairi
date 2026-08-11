import { describe, expect, it, vi } from "vitest";
import { isRateLimited } from "@/lib/rate-limit";

describe("isRateLimited", () => {
  it("allows requests up to the limit within the window", () => {
    const key = `test-${crypto.randomUUID()}`;
    for (let i = 0; i < 5; i++) {
      expect(isRateLimited(key, { limit: 5, windowMs: 60_000 })).toBe(false);
    }
  });

  it("blocks requests once the limit is exceeded within the window", () => {
    const key = `test-${crypto.randomUUID()}`;
    for (let i = 0; i < 5; i++) {
      isRateLimited(key, { limit: 5, windowMs: 60_000 });
    }
    expect(isRateLimited(key, { limit: 5, windowMs: 60_000 })).toBe(true);
  });

  it("resets the count once the window elapses", () => {
    vi.useFakeTimers();
    try {
      const key = `test-${crypto.randomUUID()}`;
      for (let i = 0; i < 5; i++) {
        isRateLimited(key, { limit: 5, windowMs: 1_000 });
      }
      expect(isRateLimited(key, { limit: 5, windowMs: 1_000 })).toBe(true);

      vi.advanceTimersByTime(1_001);
      expect(isRateLimited(key, { limit: 5, windowMs: 1_000 })).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("tracks separate keys independently", () => {
    const keyA = `test-${crypto.randomUUID()}`;
    const keyB = `test-${crypto.randomUUID()}`;
    for (let i = 0; i < 5; i++) {
      isRateLimited(keyA, { limit: 5, windowMs: 60_000 });
    }
    expect(isRateLimited(keyA, { limit: 5, windowMs: 60_000 })).toBe(true);
    expect(isRateLimited(keyB, { limit: 5, windowMs: 60_000 })).toBe(false);
  });
});
