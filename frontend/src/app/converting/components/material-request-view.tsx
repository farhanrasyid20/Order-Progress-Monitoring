"use client";

import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";
import { MaterialRequestModal } from "./material-request-modal";
import { buildMaterialRequestExportReport } from "@/lib/date-range-export";

/** Converting material and MI queue after design or production preparation. */
export function MaterialRequestView() {
  return (
    <WorkflowStageView
      stage="material-request"
      title="Material Request / Create MI"
      copy="Record material requirements and MI numbers before moving projects to Sample Progress."
      icon="box"
      summaryLanguage="en"
      queueTitle="Converting Material Queue"
      queueCopy="Converting projects awaiting material requests or MI creation"
      dateRangeExport={buildMaterialRequestExportReport}
      convertingTableFilter="material"
      renderEditModal={({ order, onClose }) => (
        <MaterialRequestModal order={order} onClose={onClose} />
      )}
    />
  );
}
