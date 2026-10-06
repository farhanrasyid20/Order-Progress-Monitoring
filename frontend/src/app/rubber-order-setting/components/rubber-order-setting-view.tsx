"use client";

import { RubberEditModal } from "./rubber-edit-modal";
import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";

/** Queue for projects being configured after Tooling Progress. */
export function RubberOrderSettingView() {
  return (
    <WorkflowStageView
      stage="rubber-order-setting"
      title="Rubber Order & Setting"
      copy="Kelola progress rubber order dan setting sebelum proses sample."
      icon="box"
      queueTitle="Antrean Rubber Order & Setting"
      queueCopy="Hanya proyek yang telah menyelesaikan tahap Tooling Progress"
      renderEditModal={({ order, onClose }) => (
        <RubberEditModal order={order} onClose={onClose} />
      )}
    />
  );
}
