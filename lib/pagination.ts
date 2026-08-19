export const DEFAULT_PAGE_SIZE = 15;
export const MAX_PAGE_SIZE = 100;

export type PaginationParams = {
  page?: string;
  per_page?: string;
};

function positiveInteger(value: string | undefined, fallback: number): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parsePagination(
  params: PaginationParams,
  options: { defaultPerPage?: number; maxPerPage?: number } = {},
) {
  const defaultPerPage = positiveInteger(
    options.defaultPerPage?.toString(),
    DEFAULT_PAGE_SIZE,
  );
  const maxPerPage = positiveInteger(
    options.maxPerPage?.toString(),
    MAX_PAGE_SIZE,
  );
  const page = positiveInteger(params.page, 1);
  const perPage = Math.min(
    positiveInteger(params.per_page, defaultPerPage),
    maxPerPage,
  );

  return {
    page,
    perPage,
    skip: (page - 1) * perPage,
    take: perPage,
  };
}

export function paginationMeta(totalItems: number, page: number, perPage: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const from = totalItems === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, totalItems);
  return { totalPages, from, to };
}
