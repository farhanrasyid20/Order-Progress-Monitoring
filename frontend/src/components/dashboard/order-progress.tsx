import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";

export type ProgressStage = {
  label: string;
  value: number;
  progress: number;
};

const defaultStages: ProgressStage[] = [
  { label: "New", value: 24, progress: 10 },
  { label: "Design", value: 18, progress: 24 },
  { label: "Review", value: 12, progress: 35 },
  { label: "Approval", value: 9, progress: 45 },
  { label: "Sample", value: 14, progress: 58 },
  { label: "QC", value: 11, progress: 73 },
  { label: "Completed", value: 159, progress: 100 },
];

type OrderProgressProps = {
  stages?: ProgressStage[];
  onViewOrders?: () => void;
};

/** Workflow-stage progress panel on the dashboard. */
export function OrderProgress({
  stages = defaultStages,
  onViewOrders,
}: OrderProgressProps) {
  return (
    <section className="card progress-card">
      <SectionHeader
        title="Order Progress"
        subtitle="Orders by current process stage"
        action={
          <Button type="button" variant="ghost" onClick={onViewOrders}>
            View all
          </Button>
        }
      />
      <div className="stage-grid">
        {stages.map((stage) => (
          <div className="stage-item" key={stage.label}>
            <div className="stage-top">
              <span>{stage.label}</span>
              <strong>{stage.value}</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${stage.progress}%` }} />
            </div>
            <small>{stage.progress}% of workflow</small>
          </div>
        ))}
      </div>
    </section>
  );
}
