import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  paginationMeta,
  parsePagination,
} from "@/lib/pagination";

describe("parsePagination", () => {
  it("defaults to the first page with 15 items", () => {
    expect(parsePagination({})).toEqual({
      page: 1,
      perPage: DEFAULT_PAGE_SIZE,
      skip: 0,
      take: DEFAULT_PAGE_SIZE,
    });
  });

  it("accepts page and per_page query parameters", () => {
    expect(parsePagination({ page: "3", per_page: "2" })).toEqual({
      page: 3,
      perPage: 2,
      skip: 4,
      take: 2,
    });
  });

  it("rejects invalid values and caps excessive page sizes", () => {
    expect(parsePagination({ page: "-2", per_page: "abc" }).page).toBe(1);
    expect(parsePagination({ page: "1", per_page: "9999" }).perPage).toBe(
      MAX_PAGE_SIZE,
    );
  });

  it("supports a page-specific default", () => {
    expect(parsePagination({}, { defaultPerPage: 30 }).perPage).toBe(30);
  });
});

describe("paginationMeta", () => {
  it("calculates page count and visible range", () => {
    expect(paginationMeta(31, 2, 15)).toEqual({
      totalPages: 3,
      from: 16,
      to: 30,
    });
  });

  it("uses an empty zero-based display range", () => {
    expect(paginationMeta(0, 1, 15)).toEqual({
      totalPages: 1,
      from: 0,
      to: 0,
    });
  });
});
