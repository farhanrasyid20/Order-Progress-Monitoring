"use client";

import { WorkflowStageView } from "./workflow-stage-view";
import { HandoffModal } from "./handoff-modal";
import type { IconName } from "@/components/ui/icon";
import type { WorkflowStage } from "@/types/order";

export type ClosingStageViewProps = {
  stage: Extract<WorkflowStage, "quality-control" | "fa-report" | "submit-sample">;
  title: string;
  copy: string;
  queueTitle: string;
  queueCopy: string;
  nextLabel: string;
  referenceLabel: string;
  referencePrefix: string;
  icon: IconName;
};

/** Shared closing queues used by both Converting and Offset flows. */
export function ClosingStageView({
  stage,
  title,
  copy,
  queueTitle,
  queueCopy,
  nextLabel,
  referenceLabel,
  referencePrefix,
  icon,
}: ClosingStageViewProps) {
  return (
    <WorkflowStageView
      stage={stage}
      title={title}
      copy={copy}
      icon={icon}
      queueTitle={queueTitle}
      queueCopy={queueCopy}
      renderEditModal={({ order, onClose }) => (
        <HandoffModal
          order={order}
          onClose={onClose}
          title={title}
          copy={copy}
          nextLabel={nextLabel}
          referenceLabel={referenceLabel}
          referencePrefix={referencePrefix}
        />
      )}
    />
  );
}
