"use client";

import { useState } from "react";
import { StandaloneRequirementModal } from "./standalone-requirement-modal";
import { ToolingEditModal } from "./tooling-edit-modal";
import { Button } from "@/components/ui/button";
import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";

/** Queue for approved projects and standalone tooling orders. */
export function ToolingProgressView() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <>
      <WorkflowStageView
        stage="tooling-progress"
        title="Order Tooling"
        copy="Manage tooling requirements for projects from Incoming Design."
        pageAction={
          <Button type="button" icon="plus" onClick={() => setIsAddModalOpen(true)}>
            Add Tooling
          </Button>
        }
        icon="settings"
        queueTitle="Order Tooling Queue"
        summaryLanguage="en"
        queueCopy="Approved projects and Order Tooling projects from Incoming Design"
        renderEditModal={({ order, onClose }) => (
          <ToolingEditModal order={order} onClose={onClose} />
        )}
      />

      {isAddModalOpen ? (
        <StandaloneRequirementModal kind="tooling" onClose={() => setIsAddModalOpen(false)} />
      ) : null}
    </>
  );
}
