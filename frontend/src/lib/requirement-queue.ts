import type { Order, StandaloneRequirementKind } from "@/types/order";

export function isCombinedRequirement(order: Order) {
  return order.workflow.preparationType === "converting" && order.workflow.productionOrder === "tooling_and_rubber";
}

export function isInRequirementQueue(order: Order, kind: StandaloneRequirementKind) {
  const stage = kind === "tooling" ? "tooling-progress" : "rubber-order-setting";
  if (order.workflow.currentStatus === "cancelled") return false;
  if (!isCombinedRequirement(order)) return order.stage === stage;
  const preparationStarted = order.stage !== "order" &&
    order.stage !== "design-incoming" && order.stage !== "design-progress" &&
    order.stage !== "review-approval";
  const forwarded = kind === "tooling"
    ? order.workflow.toolingForwarded
    : order.workflow.rubberForwarded;
  return preparationStarted && !forwarded;
}

/** Only the first requirement to continue should advance the shared project stage. */
export function shouldAdvanceRequirementStage(order: Order) {
  return order.stage === "tooling-progress" || order.stage === "rubber-order-setting";
}

export function materialRequestQueueEntries(order: Order): Order[] {
  if (order.workflow.currentStatus === "cancelled") return [];
  if (!isCombinedRequirement(order)) return order.stage === "material-request" ? [order] : [];
  return (["tooling", "rubber"] as const)
    .filter((kind) => (kind === "tooling" ? order.workflow.toolingForwarded : order.workflow.rubberForwarded) &&
      !order.workflow.materialForwarded?.[kind])
    .map<Order>((kind) => {
      const latest = order.materialRequests.filter((record) => record.source === kind).at(-1);
      return {
        ...order,
        materialRequestSource: kind,
        process: `Material Request / MI (${kind === "tooling" ? "Tooling" : "Rubber"})`,
        status: latest ? `MI ${latest.status}` : "Material Request Required",
        tone: latest ? "info" : "warning",
      };
    });
}

export function requirementQueueDisplay(order: Order, kind: StandaloneRequirementKind): Order {
  if (!isCombinedRequirement(order)) return order;
  const hasDetails = (kind === "tooling" ? order.toolingOrders : order.rubberOrders).length > 0;
  const label = kind === "tooling" ? "Tooling" : "Rubber";
  return { ...order, process: kind === "tooling" ? "Order Tooling" : "Order Rubber", status: `${label} Details ${hasDetails ? "Added" : "Required"}`, tone: hasDetails ? "info" : "warning" };
}
