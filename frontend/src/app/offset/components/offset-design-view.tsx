"use client";

import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";
import { OffsetDesignModal } from "./offset-design-modal";

/** The first dedicated queue of the Offset route after Drawing Review approval. */
export function OffsetDesignView() {
  return (
    <WorkflowStageView
      stage="offset-design"
      title="Design Offset & SPK"
      copy="Buat SPK dan detail produksi Offset sebelum proyek masuk ke Prepress."
      icon="pen"
      queueTitle="Antrean Design Offset"
      queueCopy="Proyek Offset yang telah disetujui pada Review Drawing"
      renderEditModal={({ order, onClose }) => (
        <OffsetDesignModal order={order} onClose={onClose} />
      )}
    />
  );
}
