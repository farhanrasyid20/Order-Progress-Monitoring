"use client";

import { ToolingEditModal } from "./tooling-edit-modal";
import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";

/** Queue for approved projects currently progressing through tooling. */
export function ToolingProgressView() {
  return (
    <WorkflowStageView
      stage="tooling-progress"
      title="Tooling Progress"
      copy="Kelola dan perbarui detail tooling yang sedang diproses."
      icon="settings"
      queueTitle="Antrean Tooling"
      queueCopy="Hanya proyek dengan keputusan Design Approve"
      renderEditModal={({ order, onClose }) => (
        <ToolingEditModal order={order} onClose={onClose} />
      )}
    />
  );
}
