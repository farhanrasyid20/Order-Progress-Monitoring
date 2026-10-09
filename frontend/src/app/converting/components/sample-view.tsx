"use client";

import { SampleEditModal } from "./sample-edit-modal";
import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";

/** Converting sample queue after its Material / MI work is ready. */
export function SampleView() {
  return (
    <WorkflowStageView
      stage="sample-progress"
      title="Sample Progress"
      copy="Pantau pembuatan sample Converting sebelum masuk ke QC Checking."
      icon="flask"
      queueTitle="Antrean Sample Progress"
      queueCopy="Proyek Converting yang telah menyelesaikan Material Request / Create MI"
      renderEditModal={({ order, onClose }) => (
        <SampleEditModal order={order} onClose={onClose} />
      )}
    />
  );
}
