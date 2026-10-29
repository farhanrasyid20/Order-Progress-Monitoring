"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export type OrderFiltersProps = {
  query: string;
  pic: string;
  people: string[];
  onQueryChange: (value: string) => void;
  onPicChange: (value: string) => void;
  onClear: () => void;
  /** Incoming Design uses project type because workflow cards own status filtering. */
  preparationType?: string;
  onPreparationTypeChange?: (value: string) => void;
  /** Retained for the History & Archive view, which still filters closed records by status. */
  status?: string;
  statuses?: string[];
  onStatusChange?: (value: string) => void;
};

/** Search and select controls for filtering the order list. */
export function OrderFilters({
  query,
  preparationType,
  pic,
  people,
  onQueryChange,
  onPreparationTypeChange,
  onPicChange,
  status,
  statuses = [],
  onStatusChange,
  onClear,
}: OrderFiltersProps) {
  const hasFilters = Boolean(query || preparationType || status || pic);

  return (
    <div className="filter-card card">
      <label className="search-field">
        <Icon name="search" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search PSR, customer, or PIC..."
          aria-label="Search projects"
        />
      </label>
      <select
        value={pic}
        onChange={(event) => onPicChange(event.target.value)}
        aria-label="Filter by PIC"
      >
        <option value="">PIC: All</option>
        {people.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {typeof status === "string" && onStatusChange ? (
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="">Status: All</option>
          {statuses.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <select
          value={preparationType ?? ""}
          onChange={(event) => onPreparationTypeChange?.(event.target.value)}
          aria-label="Filter by preparation type"
        >
          <option value="">Preparation Type: All</option>
          <option value="converting">Converting</option>
          <option value="offset">Offset</option>
        </select>
      )}
      <Button
        type="button"
        variant="secondary"
        onClick={onClear}
        disabled={!hasFilters}
      >
        Reset Filters
      </Button>
    </div>
  );
}
