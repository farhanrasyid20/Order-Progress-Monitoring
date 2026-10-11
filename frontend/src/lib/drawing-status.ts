import type { DrawingStatus, Order, OrderStatusTone } from "@/types/order";

export const drawingStatusOptions: readonly { value: DrawingStatus; label: string; tone: OrderStatusTone }[] = [
  { value: "no_drawing", label: "No Drawing", tone: "warning" },
  { value: "drawing_available", label: "Drawing Available", tone: "info" },
  { value: "reviewed_by_superior", label: "Reviewed by Superior", tone: "success" },
];

export function getDrawingStatus(order: Order): DrawingStatus {
  return order.workflow.drawingStatus ?? (order.workflow.drawingLink ? "drawing_available" : "no_drawing");
}
