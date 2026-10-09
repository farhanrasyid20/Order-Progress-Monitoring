"use client";

import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";
import { MaterialRequestModal } from "@/app/converting/components/material-request-modal";

/** Offset's MI queue is separate from the Converting material queue. */
export function OffsetMaterialRequestView() {
  return (
    <WorkflowStageView
      stage="offset-material-request"
      title="Offset Material / Create MI"
      copy="Kelola MI dan kesiapan material khusus sebelum proses plate Offset."
      icon="box"
      queueTitle="Antrean Material Offset"
      queueCopy="Proyek Offset yang telah menyelesaikan Prepress"
      renderEditModal={({ order, onClose }) => (
        <MaterialRequestModal order={order} onClose={onClose} offset />
      )}
    />
  );
}
