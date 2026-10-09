"use client";

import { Button } from "@/components/ui/button";

export type TablePaginationProps = {
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
};

/**
 * Shared footer for paginated data tables. The parent owns filtering and
 * slicing; this component only communicates the current page and range.
 */
export function TablePagination({
  page,
  pageCount,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = "items",
}: TablePaginationProps) {
  const safePageCount = Math.max(1, pageCount);
  const currentPage = Math.min(Math.max(1, page), safePageCount);
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);
  const visiblePageCount = Math.min(safePageCount, 3);
  const firstPageNumber = Math.min(
    Math.max(1, currentPage - 1),
    Math.max(1, safePageCount - visiblePageCount + 1),
  );
  const pageNumbers = Array.from(
    { length: visiblePageCount },
    (_, index) => firstPageNumber + index,
  );

  return (
    <nav className="pagination" aria-label={`Pagination for ${itemLabel}`}>
      <span>
        Showing {firstItem}-{lastItem} of {totalItems} {itemLabel}
      </span>
      <div>
        <Button
          type="button"
          variant="secondary"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        {pageNumbers.map((pageNumber) => (
          <button
            type="button"
            key={pageNumber}
            className={`page-number ${currentPage === pageNumber ? "active" : ""}`}
            aria-label={`Go to page ${pageNumber}`}
            aria-current={currentPage === pageNumber ? "page" : undefined}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={currentPage >= safePageCount || totalItems === 0}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}

export default TablePagination;
