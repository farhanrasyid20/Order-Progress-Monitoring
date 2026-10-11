import type { Order } from "@/types/order";

/** Same active-project definition used by the public order board. */
export function isActiveProject(order: Order) {
  return order.stage !== "completed" && order.workflow.currentStatus !== "cancelled";
}
