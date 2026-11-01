"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { ProjectVisibility } from "@/lib/active-project";

export type OrderFiltersProps = {
  query: string;
  pic: string;
  people: string[];
  onQueryChange: (value: string) => void;
  onPicChange: (value: string) => void;
  onClear: () => void;
  /** History & Archive retains the reset action; Incoming Design uses its project-status selector. */
  showReset?: boolean;
  /** Incoming Design uses project type because workflow cards own status filtering. */
  preparationType?: string;
  onPreparationTypeChange?: (value: string) => void;
  /** Opt-out for converting queues that only need Search and PIC controls. */
  showPreparationType?: boolean;
  searchPlaceholder?: string;
  /** Retained for the History & Archive view, which still filters closed records by status. */
  status?: string;
  statuses?: string[];
  onStatusChange?: (value: string) => void;
  /** Incoming Design lifecycle filter; History & Archive keeps its existing status filter. */
  projectVisibility?: ProjectVisibility;
  onProjectVisibilityChange?: (value: ProjectVisibility) => void;
};

/** Search and select controls for filtering the order list. */
export function OrderFilters({
  query,
  preparationType,
  pic,
  people,
  onQueryChange,
  onPreparationTypeChange,
  showPreparationType = true,
  searchPlaceholder = "Search PSR, customer, or PIC...",
  onPicChange,
  status,
  statuses = [],
  onStatusChange,
  projectVisibility,
  onProjectVisibilityChange,
  onClear,
  showReset = true,
}: OrderFiltersProps) {
  const hasFilters = Boolean(query || preparationType || status || pic);

  return (
    <div className="filter-card card">
      <label className="search-field">
        <Icon name="search" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
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
      ) : showPreparationType ? (
        <select
          value={preparationType ?? ""}
          onChange={(event) => onPreparationTypeChange?.(event.target.value)}
          aria-label="Filter by preparation type"
        >
          <option value="">Preparation Type: All</option>
          <option value="converting">Converting</option>
          <option value="offset">Offset</option>
        </select>
      ) : null}
      {typeof projectVisibility === "string" && onProjectVisibilityChange ? (
        <select
          value={projectVisibility}
          onChange={(event) => onProjectVisibilityChange(event.target.value as ProjectVisibility)}
          aria-label="Filter by project status"
        >
          <option value="all">Project Status: All</option>
          <option value="active">Project Status: Active</option>
          <option value="completed">Project Status: Completed</option>
          <option value="cancelled">Project Status: Cancelled</option>
        </select>
      ) : showReset ? <Button
        type="button"
        variant="secondary"
        onClick={onClear}
        disabled={!hasFilters}
      >
        Reset Filters
      </Button> : null}
    </div>
  );
}
