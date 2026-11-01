import type {
  Order,
  OrderStatusTone,
  MaterialRequestStatus,
  PreparationOrderKind,
  RequirementStatus,
  StandaloneRequirementKind,
} from "@/types/order";

const preApprovalStages = new Set([
  "order",
  "design-incoming",
  "design-progress",
  "review-approval",
]);

// Preparation tasks become available once the Incoming Design plan is saved,
// including Material Request / MI before drawing approval.
const beforeIncomingPreparationIsSaved = new Set([
  "order",
  "design-incoming",
]);

// Requirement queues show the exact selection saved in their Status dropdown.
// Keep this presentation mapping local to the queues so flat project statuses
// remain compatible with existing dashboard and workflow screens.
const requirementStatusLabels: Record<RequirementStatus, string> = {
  needed: "Needed",
  ordered: "Ordered",
  received: "Received",
  available: "Available / Existing",
  on_hold: "On Hold",
  repair: "Repair",
  issue: "Issue / Reorder",
  cancelled: "Cancelled",
};

const requirementStatusTones: Record<RequirementStatus, OrderStatusTone> = {
  needed: "warning",
  ordered: "info",
  received: "success",
  available: "success",
  on_hold: "warning",
  repair: "warning",
  issue: "danger",
  cancelled: "neutral",
};

const materialRequestStatusLabels: Record<MaterialRequestStatus, string> = {
  draft: "Draft",
  requested: "Requested",
  released: "Released",
  received: "Received",
  on_hold: "On Hold",
};

const materialRequestStatusTones: Record<MaterialRequestStatus, OrderStatusTone> = {
  draft: "neutral",
  requested: "info",
  released: "success",
  received: "success",
  on_hold: "warning",
};

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

export function hasParallelPreparation(order: Order) {
  // The shared plan also supports MI alone; Tooling and Rubber are optional.
  return !order.requirementBranch && !order.id.startsWith("standalone-") && order.workflow.preparationType === "converting" &&
    order.workflow.convertingRoute === "by_production" && order.workflow.materialRequested;
}

export function isParallelPreparationPending(order: Order) {
  return hasParallelPreparation(order) && order.workflow.currentStatus !== "cancelled" &&
    order.workflow.currentStatus !== "completed" && [
      "design-progress", "review-approval", "converting-production", "tooling-progress",
      "rubber-order-setting", "material-request",
    ].includes(order.stage);
}

export function isParallelPreparationComplete(order: Order) {
  return hasParallelPreparation(order) && Boolean(order.workflow.materialReady) &&
    selectedPreparationOrders(order).every((kind) => kind === "tooling"
      ? order.workflow.toolingReady && order.workflow.toolingForwarded
      : order.workflow.rubberReady && order.workflow.rubberForwarded);
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
    (hasParallelPreparation(order) ? isParallelPreparationPending(order)
      : !(kind === "tooling" ? order.workflow.toolingForwarded : order.workflow.rubberForwarded));
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
function materialRequestQueueDisplay(order: Order): Order {
  const latest = order.materialRequests.at(-1);

  return latest
    ? {
      ...order,
      status: materialRequestStatusLabels[latest.status],
      tone: materialRequestStatusTones[latest.status],
    }
    : order;
}

export function materialRequestQueueEntries(order: Order): Order[] {
  if (order.workflow.currentStatus === "cancelled") return [];

  if (order.workflow.preparationType === "offset") {
    return order.stage === "offset-material-request"
      ? [order]
      : [];
  }

  if (hasParallelPreparation(order)) {
    return isParallelPreparationPending(order) ? [materialRequestQueueDisplay({
      ...order,
      process: "Material Request / MI",
      status: order.workflow.materialReady ? "MI Completed - Waiting for Other Preparation" : "Material Request / MI Pending",
      tone: order.workflow.materialReady ? "success" : "warning",
    })] : [];
  }

  const preparationSaved = !beforeIncomingPreparationIsSaved.has(order.stage);
  const isConverting = order.workflow.preparationType === "converting";
  const isMaterialStage = order.stage === "material-request";

  return isConverting && preparationSaved && (order.workflow.materialRequested || isMaterialStage)
    ? [materialRequestQueueDisplay(order)]
    : [];
}

export function requirementQueueDisplay(order: Order, kind: StandaloneRequirementKind): Order {
  const records = kind === "tooling" ? order.toolingOrders : order.rubberOrders;
  const latest = records.at(-1);
  const hasDetails = records.length > 0;
  const label = kind === "tooling" ? "Tooling" : "Rubber";
  const completed = kind === "tooling"
    ? order.workflow.toolingReady && order.workflow.toolingForwarded
    : order.workflow.rubberReady && order.workflow.rubberForwarded;

  if (latest) {
    return {
      ...order,
      process: kind === "tooling" ? "Order Tooling" : "Order Rubber",
      status: requirementStatusLabels[latest.status],
      tone: requirementStatusTones[latest.status],
    };
  }

  return {
    ...order,
    process: kind === "tooling" ? "Order Tooling" : "Order Rubber",
    status: completed && isParallelPreparationPending(order)
      ? `${label} Completed - Waiting for Other Preparation`
      : `${label} Details ${hasDetails ? "Added" : "Required"}`,
    tone: completed ? "success" : hasDetails ? "info" : "warning",
  };
}
