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
        title="Tooling Progress"
        copy="Kelola dan perbarui detail tooling, termasuk order mandiri tanpa Incoming Design."
        pageAction={
          <Button type="button" icon="plus" onClick={() => setIsAddModalOpen(true)}>
            Tambah Tooling
          </Button>
        }
        icon="settings"
        queueTitle="Antrean Tooling"
        queueCopy="Proyek hasil Design Approve dan order Tooling mandiri"
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
