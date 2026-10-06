import { Icon, type IconName } from "@/components/ui/icon";

export type DashboardSummaryTone = "blue" | "amber" | "green" | "red";

export type DashboardSummary = {
  label: string;
  value: string;
  meta: string;
  icon: IconName;
  tone: DashboardSummaryTone;
};

type DashboardSummaryCardProps = {
  summary: DashboardSummary;
};

/** A single KPI card used in the dashboard summary grid. */
export function DashboardSummaryCard({
  summary,
}: DashboardSummaryCardProps) {
  return (
    <article className="summary-card">
      <div className={`summary-icon ${summary.tone}`}>
        <Icon name={summary.icon} />
      </div>
      <div className="summary-label">{summary.label}</div>
      <strong className="summary-value">{summary.value}</strong>
      <span className={`summary-meta ${summary.tone}`}>{summary.meta}</span>
    </article>
  );
}
