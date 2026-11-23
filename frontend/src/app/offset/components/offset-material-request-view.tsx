"use client";

import { WorkflowStageView } from "@/components/workflow/workflow-stage-view";
import { MaterialRequestModal } from "@/app/converting/components/material-request-modal";
import type { QueueTableFilterConfig } from "@/components/workflow/workflow-stage-view";

const offsetMaterialFilters: QueueTableFilterConfig = {
  searchPlaceholder: "Search Sample Number, customer, product, material, or MI number...",
  matchesSearch: (order, query) => !query || [order.no, order.customer, order.product, order.material, order.mainData.boardQua, order.materialRequests.at(-1)?.miNumber].some((value) => value?.toLowerCase().includes(query)),
  filters: [
    { key: "miStatus", label: "MI Status", valuesFor: (orders) => orders.map((order) => order.materialRequests.at(-1)?.status ?? ""), matches: (order, value) => order.materialRequests.at(-1)?.status === value },
    { key: "material", label: "Material", valuesFor: (orders) => orders.map((order) => order.materialRequests.at(-1)?.material || order.material), matches: (order, value) => (order.materialRequests.at(-1)?.material || order.material) === value },
  ],
};

/** Offset's MI queue is separate from the Converting material queue. */
export function OffsetMaterialRequestView() {
  return (
    <WorkflowStageView
      stage="offset-material-request"
      title="Offset Material / Create MI"
      copy="Manage MI records and material readiness before Offset plate preparation."
      icon="box"
      summaryLanguage="en"
      queueTableFilters={offsetMaterialFilters}
      queueTitle="Offset Material Queue"
      queueCopy="Offset projects that have completed Prepress"
      renderEditModal={({ order, onClose }) => (
        <MaterialRequestModal order={order} onClose={onClose} offset />
      )}
    />
  );
}
