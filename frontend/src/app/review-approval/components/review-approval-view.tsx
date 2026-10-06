"use client";

import { ApprovalEditModal } from "./approval-edit-modal";
import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";

/** Review queue for design work that has already been submitted. */
export function ReviewApprovalView() {
  return (
    <WorkflowStageView
      stage="review-approval"
      title="Review & Approval"
      copy="Tinjau desain yang masuk sebelum diteruskan ke Tooling Progress."
      icon="check"
      queueTitle="Antrean Review & Approval"
      queueCopy="Hanya desain yang telah menyelesaikan tahap Proses Desain"
      renderEditModal={({ order, onClose }) => (
        <ApprovalEditModal order={order} onClose={onClose} />
      )}
    />
  );
}
