import type { Order } from "@/types/order";

export type ProjectVisibility = "all" | "active" | "completed" | "cancelled";

/** Same active-project definition used by the public order board. */
export function isActiveProject(order: Order) {
  return order.stage !== "completed" && order.workflow.currentStatus !== "cancelled";
}

/** Keeps completed and cancelled projects distinct when a project list is filtered. */
export function matchesProjectVisibility(order: Order, visibility: ProjectVisibility) {
  if (visibility === "all") return true;
  if (visibility === "cancelled") return order.workflow.currentStatus === "cancelled";
  if (visibility === "completed") {
    return order.workflow.currentStatus !== "cancelled" && (
      order.stage === "completed" || order.workflow.currentStatus === "completed"
    );
  }

  return isActiveProject(order);
}
