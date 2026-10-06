import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";

export type ProgressStage = {
  label: string;
  value: number;
  progress: number;
};

const defaultStages: ProgressStage[] = [
  { label: "Incoming Design", value: 18, progress: 15 },
  { label: "Design Process", value: 7, progress: 28 },
  { label: "Design Decision", value: 5, progress: 42 },
  { label: "Tooling Progress", value: 6, progress: 56 },
  { label: "Rubber Order", value: 5, progress: 70 },
  { label: "Sample Progress", value: 6, progress: 85 },
  { label: "Sample Completed", value: 12, progress: 100 },
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
        title="Workflow Overview"
        subtitle="Projects grouped by their current process stage"
        action={
          <Button type="button" variant="ghost" onClick={onViewOrders}>
            View All
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
