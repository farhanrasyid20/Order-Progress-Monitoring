"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export type OrderFiltersProps = {
  query: string;
  status: string;
  pic: string;
  statuses: string[];
  people: string[];
  onQueryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPicChange: (value: string) => void;
  onClear: () => void;
};

/** Search and select controls for filtering the order list. */
export function OrderFilters({
  query,
  status,
  pic,
  statuses,
  people,
  onQueryChange,
  onStatusChange,
  onPicChange,
  onClear,
}: OrderFiltersProps) {
  const hasFilters = Boolean(query || status || pic);

  return (
    <div className="filter-card card">
      <label className="search-field">
        <Icon name="search" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search PSR, customer, or designer..."
          aria-label="Search projects"
        />
      </label>
      <select
        value={pic}
        onChange={(event) => onPicChange(event.target.value)}
        aria-label="Filter by designer"
      >
        <option value="">Designer: All</option>
        {people.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
        aria-label="Filter by status"
      >
        <option value="">Status: All</option>
        {statuses.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
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
