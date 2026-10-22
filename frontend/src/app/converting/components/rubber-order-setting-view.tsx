"use client";

import { useState } from "react";
import { RubberEditModal } from "./rubber-edit-modal";
import { StandaloneRequirementModal } from "./standalone-requirement-modal";
import { Button } from "@/components/ui/button";
import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";

/** Queue for projects and standalone orders being configured for rubber. */
export function RubberOrderSettingView() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <>
      <WorkflowStageView
        stage="rubber-order-setting"
        title="Order Rubber"
        copy="Manage rubber requirements and setting for projects from Incoming Design."
        summaryLanguage="en"
        pageAction={
          <Button type="button" icon="plus" onClick={() => setIsAddModalOpen(true)}>
            Add Rubber
          </Button>
        }
        icon="box"
        queueTitle="Order Rubber Queue"
        queueCopy="Approved projects and Order Rubber projects from Incoming Design"
        renderEditModal={({ order, onClose }) => (
          <RubberEditModal order={order} onClose={onClose} />
        )}
      />

      {isAddModalOpen ? (
        <StandaloneRequirementModal kind="rubber" onClose={() => setIsAddModalOpen(false)} />
      ) : null}
    </>
  );
}
