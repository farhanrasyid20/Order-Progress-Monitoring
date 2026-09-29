"use client";

import { Button } from "@/components/ui/button";

export type OrderPaginationProps = {
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

/** Pagination footer for the full order list. */
export function OrderPagination({
  page,
  pageCount,
  totalItems,
  pageSize,
  onPageChange,
}: OrderPaginationProps) {
  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);
  const pageNumbers = Array.from(
    { length: Math.min(pageCount, 3) },
    (_, index) => index + 1,
  );

  return (
    <div className="pagination">
      <span>
        Showing {firstItem}-{lastItem} of {totalItems} orders
      </span>
      <div>
        <Button
          type="button"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        {pageNumbers.map((pageNumber) => (
          <button
            type="button"
            key={pageNumber}
            className={`page-number ${page === pageNumber ? "active" : ""}`}
            aria-label={`Go to page ${pageNumber}`}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={page >= pageCount || totalItems === 0}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
