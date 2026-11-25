"use client";

import { useState } from "react";
import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";
import { Button } from "@/components/ui/button";
import type { IconName } from "@/components/ui/icon";
import type { WorkflowStage } from "@/types/order";
import { OffsetStageModal } from "./offset-stage-modal";
import { OffsetPrepressModal } from "./offset-prepress-modal";
import { OffsetToolingAddModal, OffsetToolingEditModal } from "./offset-tooling-management-modals";
import { OffsetVarnishModal } from "./offset-varnish-modal";
import type { QueueTableFilterConfig } from "@/components/workflow/workflow-stage-view";

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
  queueTableFilters?: QueueTableFilterConfig;
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
  queueTableFilters,
}: OffsetStageViewProps) {
  const [isAddToolingOpen, setIsAddToolingOpen] = useState(false);
  return <>
    <WorkflowStageView
      stage={stage}
      title={title}
      copy={copy}
      icon={icon}
      summaryLanguage="en"
      queueTableFilters={queueTableFilters}
      queueTitle={queueTitle}
      queueCopy={queueCopy}
      pageAction={stage === "offset-plate" ? <Button type="button" icon="plus" onClick={() => setIsAddToolingOpen(true)}>Add Tooling</Button> : undefined}
      convertingTableFilter={stage === "offset-plate" ? "offset-tooling" : undefined}
      renderEditModal={({ order, onClose }) => (
        stage === "offset-prepress"
          ? <OffsetPrepressModal order={order} onClose={onClose} />
          : stage === "offset-plate"
            ? <OffsetToolingEditModal order={order} onClose={onClose} />
            : stage === "offset-varnish"
              ? <OffsetVarnishModal order={order} onClose={onClose} />
            : <OffsetStageModal order={order} onClose={onClose} title={title} nextLabel={nextLabel} />
      )}
    />
    {isAddToolingOpen ? <OffsetToolingAddModal onClose={() => setIsAddToolingOpen(false)} /> : null}
  </>;
}
