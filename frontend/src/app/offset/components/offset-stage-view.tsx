"use client";

import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";
import type { IconName } from "@/components/ui/icon";
import type { WorkflowStage } from "@/types/order";
import { OffsetStageModal } from "./offset-stage-modal";

export type OffsetStageViewProps = {
  stage: Extract<
    WorkflowStage,
    "offset-prepress" | "offset-plate" | "offset-varnish" | "offset-press"
  >;
  title: string;
  copy: string;
  queueTitle: string;
  queueCopy: string;
  nextLabel: string;
  icon?: IconName;
};

/** Reuses one queue shell while retaining distinct Offset stages and handoffs. */
export function OffsetStageView({
  stage,
  title,
  copy,
  queueTitle,
  queueCopy,
  nextLabel,
  icon = "box",
}: OffsetStageViewProps) {
  return (
    <WorkflowStageView
      stage={stage}
      title={title}
      copy={copy}
      icon={icon}
      queueTitle={queueTitle}
      queueCopy={queueCopy}
      renderEditModal={({ order, onClose }) => (
        <OffsetStageModal order={order} onClose={onClose} title={title} nextLabel={nextLabel} />
      )}
    />
  );
}
