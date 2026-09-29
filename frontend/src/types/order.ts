/**
 * Shared order shape used by the dashboard, order list, and workflow queues.
 * This is deliberately UI-focused for now; the backend can replace this with
 * an API model later without changing the presentation components.
 */
export type OrderStatusTone = "info" | "success" | "warning" | "danger" | "neutral";

export type Order = {
  no: string;
  customer: string;
  product: string;
  process: string;
  pic: string;
  deadline: string;
  status: string;
  tone: OrderStatusTone;
};
