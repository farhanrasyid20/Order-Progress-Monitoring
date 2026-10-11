import type { Order } from "@/types/order";

/** Display snapshot; incomingDesignId remains the relationship's source of truth. */
export function issueProjectInfo(order: Order) {
  return {
    projectCode: order.no,
    source: order.mainData.custName || order.customer,
    partCode: order.mainData.partNo,
    productDescription: order.mainData.component || order.product,
  };
}
