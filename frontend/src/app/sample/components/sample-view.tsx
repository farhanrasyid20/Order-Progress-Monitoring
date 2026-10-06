"use client";

import { SampleEditModal } from "./sample-edit-modal";
import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";

/** Sample Progress queue for work that completed Rubber Order & Setting. */
export function SampleView() {
  return (
    <WorkflowStageView
      stage="sample-progress"
      title="Sample Progress"
      copy="Pantau pembuatan sample sebelum masuk ke tahap sample selesai."
      icon="flask"
      queueTitle="Antrean Sample Progress"
      queueCopy="Hanya proyek yang telah menyelesaikan tahap Rubber Order & Setting"
      renderEditModal={({ order, onClose }) => (
        <SampleEditModal order={order} onClose={onClose} />
      )}
    />
  );
}
