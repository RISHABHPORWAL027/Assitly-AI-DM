export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
export type PageSizeOption = typeof PAGE_SIZE_OPTIONS[number];
export const DEFAULT_PAGE_SIZE: PageSizeOption = 10;

export function getTotalPages(totalCount: number, pageSize: number): number {
  if (totalCount <= 0) return 1;
  return Math.ceil(totalCount / pageSize);
}

export function paginateSlice<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function getPageRange(page: number, pageSize: number, totalCount: number) {
  if (totalCount === 0) {
    return { start: 0, end: 0 };
  }
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);
  return { start, end };
}
