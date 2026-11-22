import type { Order, WorkflowStage } from "@/types/order";

const offsetStages = new Set<WorkflowStage>([
  "offset-prepress",
  "offset-material-request",
  "offset-plate",
  "offset-varnish",
  "offset-press",
]);

const offsetHandoffSourceStage: Partial<Record<WorkflowStage, WorkflowStage>> = {
  "offset-material-request": "offset-prepress",
  "offset-plate": "offset-material-request",
  "offset-varnish": "offset-plate",
  "offset-press": "offset-varnish",
};

/**
 * Returns the user-written handoff note for an Offset destination stage.
 * Automatic "Moved to …" events are intentionally excluded.
 */
function handoffRemarkFromHistory(order: Order): string | undefined {
  const record = [...order.processHistory].reverse().find((entry) => {
    if (order.stage === "offset-prepress") return entry.process === "incoming_preparation";
    return entry.process === "handoff_details_updated" &&
      entry.stage === offsetHandoffSourceStage[order.stage];
  });

  return record?.remark.trim();
}

/** Shared Status source for both Offset queue tables and Details modals. */
export function offsetHandoffStatus(order: Order) {
  if (order.workflow.preparationType !== "offset" || !offsetStages.has(order.stage)) {
    return order.status;
  }

  const storedRemark = order.workflow.offsetHandoffRemark?.trim();
  if (storedRemark) return storedRemark;

  // Keep projects saved before `offsetHandoffRemark` was introduced readable.
  return handoffRemarkFromHistory(order) || "-";
}
