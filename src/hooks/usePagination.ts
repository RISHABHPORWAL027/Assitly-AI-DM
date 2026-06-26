import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_PAGE_SIZE,
  getTotalPages,
  paginateSlice,
  type PageSizeOption,
} from '../lib/pagination';

interface UsePaginationOptions {
  initialPageSize?: PageSizeOption;
  /** Change this when filters/search change to reset to page 1 */
  resetKey?: string | number;
}

export function usePagination<T>(items: T[], options?: UsePaginationOptions) {
  const initialPageSize = options?.initialPageSize ?? DEFAULT_PAGE_SIZE;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(initialPageSize);

  const totalCount = items.length;
  const totalPages = getTotalPages(totalCount, pageSize);

  useEffect(() => {
    setPage(1);
  }, [options?.resetKey]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedItems = useMemo(
    () => paginateSlice(items, page, pageSize),
    [items, page, pageSize]
  );

  const handlePageSizeChange = (size: PageSizeOption) => {
    setPageSize(size);
    setPage(1);
  };

  return {
    page,
    pageSize,
    setPage,
    setPageSize: handlePageSizeChange,
    totalCount,
    totalPages,
    paginatedItems,
  };
}
