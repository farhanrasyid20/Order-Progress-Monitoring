import type { Order, WorkflowStage } from "@/types/order";
import { isCombinedRequirement } from "./requirement-queue";

const preparationStages: WorkflowStage[] = ["order", "design-incoming", "design-progress", "review-approval"];

/** Keep the PSR and lineage, but give each requirement its own mutable workflow record. */
export function splitRequirementBranches(order: Order, transition: (order: Order, stage: WorkflowStage) => Order): Order[] {
  if (!isCombinedRequirement(order) || order.requirementBranch || preparationStages.includes(order.stage)) return [order];
  return (["tooling", "rubber"] as const).map(kind => {
    const forwarded = kind === "tooling" ? order.workflow.toolingForwarded : order.workflow.rubberForwarded;
    const materialForwarded = Boolean(order.workflow.materialForwarded?.[kind]);
    const stage: WorkflowStage = order.workflow.currentStatus === "cancelled" || order.stage === "completed" ? order.stage
      : !forwarded ? kind === "tooling" ? "tooling-progress" : "rubber-order-setting"
      : !materialForwarded ? "material-request"
      : ["tooling-progress", "rubber-order-setting", "material-request"].includes(order.stage) ? "sample-progress" : order.stage;
    const branch: Order = {
      ...order,
      id: kind === "tooling" ? order.id : order.id + "-rubber",
      requirementBranch: kind,
      sourceProjectId: order.id,
      materialRequestSource: kind,
      workflow: { ...order.workflow, productionOrder: kind },
      toolingOrders: kind === "tooling" ? order.toolingOrders : [],
      rubberOrders: kind === "rubber" ? order.rubberOrders : [],
      materialRequests: order.materialRequests.filter(record => record.source === kind),
      sampleProgress: materialForwarded ? order.sampleProgress : [],
      sampleSubmissions: materialForwarded ? order.sampleSubmissions : [],
      processHistory: order.processHistory.filter(record => {
        if (record.process === (kind === "tooling" ? "rubber_requirement" : "tooling_requirement")) return false;
        if (!materialForwarded && ["sample_progress", "sample_submitted", "sample_decision", "handoff_details_updated"].includes(record.process)) return false;
        if (record.source) return record.source === kind;
        return true;
      }),
    };
    // Rebuild stage metadata for a branch that was behind the shared legacy stage.
    return stage === order.stage ? branch : transition(branch, stage);
  });
}

export function matchesOrder(order: Order, key: string) {
  return order.id === key || (!order.requirementBranch && order.no === key);
}

