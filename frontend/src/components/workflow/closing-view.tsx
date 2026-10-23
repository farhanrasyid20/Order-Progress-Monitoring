"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClosingStageView } from "./closing-stage-view";
import { WorkflowStageView } from "./workflow-stage-view";
import { useWorkflowOrders } from "./workflow-provider";
import { SubmitSampleModal } from "./submit-sample-modal";
import { AfterSampleEditModal } from "@/app/after-sample/components/after-sample-edit-modal";

const tabs = [
  { stage: "quality-control", label: "QC Checking" },
  { stage: "fa-report", label: "FA Report" },
  { stage: "submit-sample", label: "Ready to Submit" },
  { stage: "sample-completed", label: "Sample Decision" },
] as const;
type ClosingStage = typeof tabs[number]["stage"];

export function ClosingView({ initialStage = "quality-control" }: { initialStage?: ClosingStage }) {
  const [stage, setStage] = useState<ClosingStage>(initialStage);
  const { orders } = useWorkflowOrders();
  return <>
    <nav aria-label="Closing processes" className="closing-tabs">
      {tabs.map((tab) => <Button key={tab.stage} type="button" variant={stage === tab.stage ? "primary" : "secondary"} aria-pressed={stage === tab.stage} onClick={() => setStage(tab.stage)}>
        {tab.label} ({orders.filter((order) => order.stage === tab.stage && order.workflow.currentStatus !== "cancelled").length})
      </Button>)}
    </nav>
    {stage === "quality-control" ? <ClosingStageView key={stage} stage={stage} title="QC Checking" copy="Inspect Converting samples or Offset Press results before preparing the FA Report." queueTitle="QC Checking Queue" queueCopy="Results awaiting quality inspection" nextLabel="FA Report" referenceLabel="QC Number" referencePrefix="QC" icon="shield" language="en" /> : null}
    {stage === "fa-report" ? <ClosingStageView key={stage} stage={stage} title="FA Report" copy="Complete the First Article report. Submit the sample separately after the report is completed." queueTitle="FA Report Queue" queueCopy="Projects that have completed QC Checking" nextLabel="Ready to Submit" referenceLabel="FA Report Number" referencePrefix="FA" icon="file" language="en" /> : null}
    {stage === "submit-sample" ? <WorkflowStageView key={stage} stage={stage} title="Ready to Submit" copy="Use Submit Sample to record the submission date and confirm delivery." icon="check" queueTitle="Samples Ready to Submit" queueCopy="Projects with completed FA Reports" summaryLanguage="en" editActionLabel="Submit Sample" renderEditModal={({ order, onClose }) => <SubmitSampleModal order={order} onClose={onClose} />} /> : null}
    {stage === "sample-completed" ? <WorkflowStageView key={stage} stage={stage} title="Sample Decision" copy="Sample Approve completes the project and moves it to History & Archive; Revision returns to Design; Cancel closes the project as cancelled." icon="check" queueTitle="Sample Decision Queue" queueCopy="Submitted samples awaiting a decision" summaryLanguage="en" editActionLabel="Record Decision" renderEditModal={({ order, onClose }) => <AfterSampleEditModal order={order} onClose={onClose} />} /> : null}
  </>;
}
