import type { Order, StandaloneRequirementKind } from "@/types/order";

export function isCombinedRequirement(order: Order) {
  return order.workflow.preparationType === "converting" && order.workflow.productionOrder === "tooling_and_rubber";
}

export function isInRequirementQueue(order: Order, kind: StandaloneRequirementKind) {
  const stage = kind === "tooling" ? "tooling-progress" : "rubber-order-setting";
  if (order.workflow.currentStatus === "cancelled") return false;
  if (!isCombinedRequirement(order)) return order.stage === stage;
  return (order.stage === "tooling-progress" || order.stage === "rubber-order-setting") &&
    !(kind === "tooling" ? order.workflow.toolingReady : order.workflow.rubberReady);
}

export function requirementQueueDisplay(order: Order, kind: StandaloneRequirementKind): Order {
  if (!isCombinedRequirement(order)) return order;
  const hasDetails = (kind === "tooling" ? order.toolingOrders : order.rubberOrders).length > 0;
  const label = kind === "tooling" ? "Tooling" : "Rubber";
  return { ...order, process: kind === "tooling" ? "Tooling Progress" : "Rubber Order & Setting", status: `${label} Details ${hasDetails ? "Added" : "Required"}`, tone: hasDetails ? "info" : "warning" };
}
