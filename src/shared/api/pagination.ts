/** DRF sahifalangan javob shakli. */
export interface DrfPage<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  next: string | null;
  previous: string | null;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

function getPageFromUrl(value: string | null | undefined): number | null {
  if (!value) return null;
  try {
    return Number(new URL(value).searchParams.get("page")) || null;
  } catch {
    return null;
  }
}

/** Massiv ham, DRF `{count, results}` ham bir xil `Page<T>` shakliga keltiriladi. */
export function normalizePagination<T = unknown>(
  payload: unknown,
  { page = 1, pageSize = 20 }: PaginationOptions = {}
): Page<T> {
  const envelope = payload as { success?: boolean; data?: unknown } | null;
  const source = (envelope?.success === true ? envelope.data : payload) as
    | T[]
    | DrfPage<T>
    | null
    | undefined;

  const items = Array.isArray(source) ? source : (source?.results ?? []);
  const total = Array.isArray(source) ? source.length : Number(source?.count ?? items.length);
  const previous = Array.isArray(source) ? null : (source?.previous ?? null);
  const next = Array.isArray(source) ? null : (source?.next ?? null);

  const previousPage = getPageFromUrl(previous);
  const resolvedPage = previousPage ? previousPage + 1 : Number(page);
  const resolvedPageSize = Math.max(1, Number(pageSize) || items.length || 1);

  return {
    items,
    page: resolvedPage,
    pageSize: resolvedPageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / resolvedPageSize)),
    next,
    previous,
  };
}
