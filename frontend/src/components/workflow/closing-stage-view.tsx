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
  language?: "id" | "en";
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
  language = "id",
}: ClosingStageViewProps) {
  return (
    <WorkflowStageView
      stage={stage}
      editActionLabel={stage === "quality-control" ? "Complete QC" : "Complete FA Report"}
      title={title}
      copy={copy}
      icon={icon}
      summaryLanguage={language}
      queueTitle={queueTitle}
      queueCopy={queueCopy}
      renderEditModal={({ order, onClose }) => (
        <HandoffModal
          order={order}
          language={language}
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
