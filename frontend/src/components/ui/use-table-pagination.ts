"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export const DEFAULT_TABLE_PAGE_SIZE = 5;

/** Keeps page bounds and slicing consistent across client-side data tables. */
export function useTablePagination<Item>(
  items: readonly Item[],
  pageSize = DEFAULT_TABLE_PAGE_SIZE,
) {
  const safePageSize = Math.max(1, pageSize);
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / safePageSize));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const start = (currentPage - 1) * safePageSize;
  const pageItems = useMemo(
    () => items.slice(start, start + safePageSize),
    [items, safePageSize, start],
  );

  useEffect(() => {
    setPage((current) => Math.min(Math.max(1, current), pageCount));
  }, [pageCount]);

  const goToPage = useCallback(
    (nextPage: number) => {
      setPage(Math.min(Math.max(1, nextPage), pageCount));
    },
    [pageCount],
  );
  const resetPage = useCallback(() => setPage(1), []);

  return {
    page: currentPage,
    pageCount,
    pageSize: safePageSize,
    totalItems: items.length,
    pageItems,
    goToPage,
    resetPage,
  };
}
