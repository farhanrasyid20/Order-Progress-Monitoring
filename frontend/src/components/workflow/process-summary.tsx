import { Icon, type IconName } from "@/components/ui/icon";

export type ProcessSummaryProps = {
  icon: IconName;
};

const processMetrics = [
  ["Desain Masuk", "18"],
  ["Proses Desain", "7"],
  ["Sample Progress", "6"],
  ["Sample Selesai", "12"],
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
          <span className="summary-meta">Diperbarui hari ini</span>
        </article>
      ))}
    </div>
  );
}
