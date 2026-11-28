import type { OffsetPreparationStatus, Order } from "@/types/order";

export const defaultOffsetPreparationStatus = "not_ordered";

export const offsetPreparationStatusOptions = [
  { value: defaultOffsetPreparationStatus, label: "Not Ordered" },
  { value: "ordered", label: "Ordered" },
  { value: "received", label: "Received" },
  { value: "cancelled", label: "Cancelled" },
] as const satisfies readonly { value: OffsetPreparationStatus; label: string }[];

export function isOffsetPreparationStatus(status: unknown): status is OffsetPreparationStatus {
  return offsetPreparationStatusOptions.some((option) => option.value === status);
}

export function offsetToolingStatus(status: string) {
  return status === "needed" ? defaultOffsetPreparationStatus : status;
}

export function offsetToolingQueueStatus(order: Order) {
  const records = order.offsetToolingRecords;
  const record = records?.find((item) => item.id === order.offsetToolingId) ?? records?.at(-1) ?? order.offsetTooling;
  return offsetToolingStatus(record?.status ?? defaultOffsetPreparationStatus);
}

const legacyToolingLabels: Readonly<Record<string, string>> = {
  available: "Available / Existing", on_hold: "On Hold", repair: "Repair", issue: "Issue / Reorder",
};

export function offsetPreparationStatusLabel(status: string) {
  return offsetPreparationStatusOptions.find((option) => option.value === status)?.label ??
    `Legacy: ${legacyToolingLabels[status] ?? status}`;
}
