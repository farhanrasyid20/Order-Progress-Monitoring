"use client";

import { DrawingEditModal } from "./drawing-edit-modal";
import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";

/** Proses Desain queue. This stage receives projects from Desain Masuk. */
export function DesignDrawingView() {
  return (
    <WorkflowStageView
      stage="design-progress"
      title="Proses Desain"
      copy="Selesaikan desain lalu kirim link drawing ke Incoming Design."
      icon="pen"
      queueTitle="Antrean Proses Desain"
      queueCopy="Hanya proyek yang sedang berada pada tahap proses desain"
      renderEditModal={({ order, onClose }) => (
        <DrawingEditModal order={order} onClose={onClose} />
      )}
    />
  );
}
