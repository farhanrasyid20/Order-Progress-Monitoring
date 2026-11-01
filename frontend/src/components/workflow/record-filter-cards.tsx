"use client";

export type RecordFilterOption = {
  value: string;
  label: string;
};

export type RecordFilterCardsProps = {
  title: string;
  description: string;
  options: readonly RecordFilterOption[];
  selectedValue: string;
  countForValue: (value: string) => number;
  totalCount: number;
  onChange: (value: string) => void;
};

/**
 * Status-record filter cards share the Incoming Design card layout while
 * leaving the record data and filtering decision with their parent screen.
 */
export function RecordFilterCards({
  title,
  description,
  options,
  selectedValue,
  countForValue,
  totalCount,
  onChange,
}: RecordFilterCardsProps) {
  const cards: readonly RecordFilterOption[] = [{ value: "", label: "All" }, ...options];

  return (
    <section className="card workflow-filter-card" aria-label={`${title} filter`}>
      <div className="workflow-filter-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <strong>{totalCount} records</strong>
      </div>
      <div className="workflow-filter-grid record-filter-grid">
        {cards.map((card) => {
          const isActive = selectedValue === card.value;
          const isAll = card.value === "";

          return (
            <button
              type="button"
              className={`workflow-filter-item ${isActive ? "is-active" : ""}`}
              aria-pressed={isActive}
              key={card.value || "all"}
              onClick={() => onChange(isAll || isActive ? "" : card.value)}
            >
              <span>{card.label}</span>
              <strong>{isAll ? totalCount : countForValue(card.value)}</strong>
              <small>{isAll ? "All records" : "Filter records"}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default RecordFilterCards;
