import { Icon, type IconName } from "@/components/ui/icon";

export type ProcessSummaryProps = {
  icon: IconName;
};

const processMetrics = [
  ["Assigned", "18"],
  ["In Progress", "9"],
  ["Waiting", "5"],
  ["Completed this month", "42"],
] as const;

/** Reusable KPI row for process-specific workflow pages. */
export function ProcessSummary({ icon }: ProcessSummaryProps) {
  return (
    <div className="summary-grid process-summary">
      {processMetrics.map(([label, value], index) => (
        <article className="summary-card" key={label}>
          <div className={`summary-icon ${index === 3 ? "green" : "blue"}`}>
            <Icon name={icon} />
          </div>
          <div className="summary-label">{label}</div>
          <strong className="summary-value">{value}</strong>
          <span className="summary-meta">Updated today</span>
        </article>
      ))}
    </div>
  );
}
