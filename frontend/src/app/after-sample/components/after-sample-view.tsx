"use client";

import { AfterSampleEditModal } from "./after-sample-edit-modal";
import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";

/** Final decision queue for completed samples. */
export function AfterSampleView() {
  return (
    <WorkflowStageView
      stage="sample-completed"
      title="After Sample / Decision"
      copy="Tentukan apakah sample dilanjutkan ke order atau ditutup sebagai sample saja."
      icon="check"
      queueTitle="Antrean Sample Selesai"
      queueCopy="Hanya proyek dengan sample yang telah selesai"
      renderEditModal={({ order, onClose }) => (
        <AfterSampleEditModal order={order} onClose={onClose} />
      )}
    />
  );
}
