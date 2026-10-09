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
        title="Rubber Order & Setting"
        copy="Kelola progress rubber dan setting, termasuk order mandiri tanpa Incoming Design."
        pageAction={
          <Button type="button" icon="plus" onClick={() => setIsAddModalOpen(true)}>
            Tambah Rubber
          </Button>
        }
        icon="box"
        queueTitle="Antrean Rubber Order & Setting"
        queueCopy="Proyek hasil proses sebelumnya dan order Rubber mandiri"
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
