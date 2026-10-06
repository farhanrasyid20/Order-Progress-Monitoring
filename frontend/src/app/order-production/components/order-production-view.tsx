"use client";

import { OrderProductionEditModal } from "./order-production-edit-modal";
import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";

/** Queue for approved samples that continue into order and production. */
export function OrderProductionView() {
  return (
    <WorkflowStageView
      stage="order-production"
      title="Order / Production"
      copy="Kelola proyek yang dilanjutkan dari keputusan after sample."
      icon="box"
      queueTitle="Antrean Order / Production"
      queueCopy="Hanya proyek yang diputuskan untuk lanjut ke order"
      renderEditModal={({ order, onClose }) => (
        <OrderProductionEditModal order={order} onClose={onClose} />
      )}
    />
  );
}
