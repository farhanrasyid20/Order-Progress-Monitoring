"use client";

import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";
import { MaterialRequestModal } from "./material-request-modal";

/** Converting material and MI queue after design or production preparation. */
export function MaterialRequestView() {
  return (
    <WorkflowStageView
      stage="material-request"
      title="Material Request / Create MI"
      copy="Catat kebutuhan material dan nomor MI sebelum proyek masuk ke Sample Process."
      icon="box"
      queueTitle="Antrean Material Converting"
      queueCopy="Proyek Converting yang menunggu material request atau MI"
      renderEditModal={({ order, onClose }) => (
        <MaterialRequestModal order={order} onClose={onClose} />
      )}
    />
  );
}
