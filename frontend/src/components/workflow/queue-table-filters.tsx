"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export type QueueFilterControl = { key: string; label: string; options: readonly string[] };

export type QueueTableFiltersProps = {
  query: string;
  searchPlaceholder: string;
  controls: readonly QueueFilterControl[];
  values: Record<string, string>;
  onQueryChange: (value: string) => void;
  onValueChange: (key: string, value: string) => void;
  onReset: () => void;
};

/** Shared presentation only; every queue owns its options and matching rules. */
export function QueueTableFilters({ query, searchPlaceholder, controls, values, onQueryChange, onValueChange, onReset }: QueueTableFiltersProps) {
  const hasFilters = Boolean(query || controls.some((control) => values[control.key]));
  return <div className="filter-card card">
    <label className="search-field"><Icon name="search" /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={searchPlaceholder} aria-label="Search queue" /></label>
    {controls.map((control) => <select key={control.key} value={values[control.key] ?? ""} onChange={(event) => onValueChange(control.key, event.target.value)} aria-label={`Filter by ${control.label}`}>
      <option value="">{control.label}: All</option>
      {control.options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>)}
    <Button type="button" variant="secondary" onClick={onReset} disabled={!hasFilters}>Reset Filters</Button>
  </div>;
}
