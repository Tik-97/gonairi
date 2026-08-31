import { describe, expect, it } from "vitest";
import { PUBLIC_TOUR_VISIBILITY } from "@/lib/tours/visibility";

describe("PUBLIC_TOUR_VISIBILITY", () => {
  it("requires a published, non-private, non-deleted tour", () => {
    expect(PUBLIC_TOUR_VISIBILITY).toEqual({
      isPublished: true,
      isPrivate: false,
      deletedAt: null,
    });
  });
});
