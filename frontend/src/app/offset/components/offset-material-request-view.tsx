"use client";

import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";
import { MaterialRequestModal } from "@/app/converting/components/material-request-modal";

/** Offset's MI queue is separate from the Converting material queue. */
export function OffsetMaterialRequestView() {
  return (
    <WorkflowStageView
      stage="offset-material-request"
      title="Offset Material / Create MI"
      copy="Manage MI records and material readiness before Offset plate preparation."
      icon="box"
      summaryLanguage="en"
      queueTitle="Offset Material Queue"
      queueCopy="Offset projects that have completed Prepress"
      renderEditModal={({ order, onClose }) => (
        <MaterialRequestModal order={order} onClose={onClose} offset />
      )}
    />
  );
}
