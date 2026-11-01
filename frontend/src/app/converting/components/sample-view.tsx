"use client";

import { SampleEditModal } from "./sample-edit-modal";
import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";
import { buildSampleProgressExportReport } from "@/lib/date-range-export";

/** Converting sample queue after its Material / MI work is ready. */
export function SampleView() {
  return (
    <WorkflowStageView
      stage="sample-progress"
      title="Sample Progress"
      copy="Track Converting sample production before moving to QC Checking."
      icon="flask"
      summaryLanguage="en"
      queueTitle="Sample Progress Queue"
      queueCopy="Converting projects that have completed Material Request / Create MI"
      dateRangeExport={buildSampleProgressExportReport}
      convertingTableFilter="sample"
      renderEditModal={({ order, onClose }) => (
        <SampleEditModal order={order} onClose={onClose} />
      )}
    />
  );
}
