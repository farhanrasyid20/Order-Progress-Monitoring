"use client";

import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";
import { OffsetDesignModal } from "./offset-design-modal";

/** The first dedicated queue of the Offset route after Drawing Review approval. */
export function OffsetDesignView() {
  return (
    <WorkflowStageView
      stage="offset-design"
      title="Offset Design & SPK"
      copy="Create the SPK and Offset production details before moving projects to Prepress."
      icon="pen"
      summaryLanguage="en"
      queueTitle="Offset Design Queue"
      queueCopy="Offset projects approved during Drawing Review"
      renderEditModal={({ order, onClose }) => (
        <OffsetDesignModal order={order} onClose={onClose} />
      )}
    />
  );
}
