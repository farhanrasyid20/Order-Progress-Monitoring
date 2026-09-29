"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export type OrderFiltersProps = {
  query: string;
  status: string;
  process: string;
  pic: string;
  statuses: string[];
  processes: string[];
  people: string[];
  onQueryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onProcessChange: (value: string) => void;
  onPicChange: (value: string) => void;
  onClear: () => void;
};

/** Search and select controls for filtering the order list. */
export function OrderFilters({
  query,
  status,
  process,
  pic,
  statuses,
  processes,
  people,
  onQueryChange,
  onStatusChange,
  onProcessChange,
  onPicChange,
  onClear,
}: OrderFiltersProps) {
  const hasFilters = Boolean(query || status || process || pic);

  return (
    <div className="filter-card card">
      <label className="search-field">
        <Icon name="search" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search order, customer, or product..."
          aria-label="Search orders"
        />
      </label>
      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
        aria-label="Filter by status"
      >
        <option value="">All Status</option>
        {statuses.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <select
        value={process}
        onChange={(event) => onProcessChange(event.target.value)}
        aria-label="Filter by process"
      >
        <option value="">All Process</option>
        {processes.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <select
        value={pic}
        onChange={(event) => onPicChange(event.target.value)}
        aria-label="Filter by person in charge"
      >
        <option value="">All PIC</option>
        {people.map((option) => (
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
        Clear filters
      </Button>
    </div>
  );
}
