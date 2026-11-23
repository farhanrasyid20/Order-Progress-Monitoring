"use client";

import { OffsetStageView } from "../components";
import type { QueueTableFilterConfig } from "@/components/workflow/workflow-stage-view";

const prepressFilters: QueueTableFilterConfig = {
  searchPlaceholder: "Search Sample Number, customer, product, No. JO/PN, or Plate ID...",
  matchesSearch: (order, query) => !query || [order.no, order.customer, order.product, order.offsetPrepress?.noJoPnCode, order.offsetPrepress?.idPlate].some((value) => value?.toLowerCase().includes(query)),
  filters: [
    { key: "plateType", label: "Plate Type", valuesFor: (orders) => orders.map((order) => order.offsetPrepress?.plateType ?? ""), matches: (order, value) => order.offsetPrepress?.plateType === value },
    { key: "pic", label: "PIC", valuesFor: (orders) => orders.map((order) => order.offsetPrepress?.updatedBy || order.pic), matches: (order, value) => (order.offsetPrepress?.updatedBy || order.pic) === value },
  ],
};

export default function OffsetPrepressPage() {
  return (
    <OffsetStageView
      stage="offset-prepress"
      title="Prepress"
      copy="Check files, color separations, and prepress readiness before requesting Offset materials."
      queueTitle="Offset Prepress Queue"
      queueCopy="Offset SPKs created during Offset Design"
      nextLabel="Offset Material / Create MI"
      icon="pen"
      queueTableFilters={prepressFilters}
    />
  );
}
