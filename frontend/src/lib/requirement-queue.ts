import type { Order, PreparationOrderKind, StandaloneRequirementKind } from "@/types/order";

const preApprovalStages = new Set([
  "order",
  "design-incoming",
  "design-progress",
  "review-approval",
]);

// Tooling/Rubber planning is saved from Incoming Design before the drawing is
// approved, so those two queues intentionally become available earlier than
// Material Request / MI.
const beforeIncomingPreparationIsSaved = new Set([
  "order",
  "design-incoming",
]);

/** Read new multi-select data and gracefully understand records persisted by the old prototype. */
export function selectedPreparationOrders(order: Order): PreparationOrderKind[] {
  const legacy = order.workflow.productionOrder === "tooling_and_rubber"
    ? (["tooling", "rubber"] as const)
    : order.workflow.productionOrder
      ? [order.workflow.productionOrder]
      : [];
  const stageFallback = order.stage === "tooling-progress"
    ? (["tooling"] as const)
    : order.stage === "rubber-order-setting"
      ? (["rubber"] as const)
      : [];
  const selections = order.workflow.preparationOrders?.length
    ? order.workflow.preparationOrders
    : legacy.length
      ? legacy
      : stageFallback;

  return [...new Set(selections.filter((kind): kind is PreparationOrderKind =>
    kind === "tooling" || kind === "rubber",
  ))];
}

/** Compatibility export: combined orders no longer create cloned project branches. */
export function isCombinedRequirement(order?: Order) {
  void order;
  return false;
}

export function isInRequirementQueue(order: Order, kind: StandaloneRequirementKind) {
  if (
    order.workflow.currentStatus === "cancelled" ||
    beforeIncomingPreparationIsSaved.has(order.stage)
  ) {
    return false;
  }

  return order.workflow.preparationType === "converting" &&
    order.workflow.convertingRoute === "by_production" &&
    selectedPreparationOrders(order).includes(kind) &&
    !(kind === "tooling" ? order.workflow.toolingForwarded : order.workflow.rubberForwarded);
}

/**
 * A project gets one initial Tooling/Rubber selection from Incoming Design.
 * Once that first detail exists, a later repeat order is deliberately entered
 * from the corresponding converting sidebar by selecting the same PSR code.
 */
export function canAddRepeatRequirement(order: Order, kind: StandaloneRequirementKind) {
  const records = kind === "tooling" ? order.toolingOrders : order.rubberOrders;

  if (
    order.workflow.currentStatus === "cancelled" ||
    order.workflow.currentStatus === "completed" ||
    order.stage === "completed" ||
    preApprovalStages.has(order.stage)
  ) {
    return false;
  }

  return order.workflow.preparationType === "converting" &&
    order.workflow.convertingRoute === "by_production" &&
    records.length > 0;
}

/** Allows an initial queued task or a later repeat order for its PSR code. */
export function canRecordConvertingRequirement(order: Order, kind: StandaloneRequirementKind) {
  return isInRequirementQueue(order, kind) || canAddRepeatRequirement(order, kind);
}

/** Retained for old callers. The queue no longer advances a shared cloned branch. */
export function shouldAdvanceRequirementStage(order?: Order) {
  void order;
  return false;
}

/**
 * A material request is one task per project. It may be requested independently
 * for Converting.
 */
export function materialRequestQueueEntries(order: Order): Order[] {
  if (order.workflow.currentStatus === "cancelled") return [];

  if (order.workflow.preparationType === "offset") {
    return order.stage === "offset-material-request"
      ? [order]
      : [];
  }

  const afterApproval = !preApprovalStages.has(order.stage);
  const isConverting = order.workflow.preparationType === "converting";
  const isMaterialStage = order.stage === "material-request";

  return isConverting && afterApproval && (order.workflow.materialRequested || isMaterialStage)
    ? [order]
    : [];
}

export function requirementQueueDisplay(order: Order, kind: StandaloneRequirementKind): Order {
  const hasDetails = (kind === "tooling" ? order.toolingOrders : order.rubberOrders).length > 0;
  const label = kind === "tooling" ? "Tooling" : "Rubber";

  return {
    ...order,
    process: kind === "tooling" ? "Order Tooling" : "Order Rubber",
    status: `${label} Details ${hasDetails ? "Added" : "Required"}`,
    tone: hasDetails ? "info" : "warning",
  };
}
