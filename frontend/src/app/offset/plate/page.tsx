"use client";

import { OffsetStageView } from "../components";
import type { QueueTableFilterConfig } from "@/components/workflow/workflow-stage-view";

const plateFilters: QueueTableFilterConfig = {
  searchPlaceholder: "Search Sample Number, customer, product, Plate ID, or machine...",
  matchesSearch: (order, query) => !query || [order.no, order.customer, order.product, order.offsetPrepress?.idPlate, order.mainData.printingMachine].some((value) => value?.toLowerCase().includes(query)),
  filters: [
    { key: "plateType", label: "Plate Type", valuesFor: (orders) => orders.map((order) => order.offsetPrepress?.plateType ?? ""), matches: (order, value) => order.offsetPrepress?.plateType === value },
    { key: "machine", label: "Machine", valuesFor: (orders) => orders.map((order) => order.mainData.printingMachine ?? ""), matches: (order, value) => order.mainData.printingMachine === value },
  ],
};

export default function OffsetPlatePage() {
  return (
    <OffsetStageView
      stage="offset-plate"
      title="Tooling / Plate"
      copy="Track plate and tooling requirements for Offset jobs."
      queueTitle="Tooling / Plate Queue"
      queueCopy="Offset materials released and awaiting plate preparation"
      nextLabel="Block / Spot Varnish"
      queueTableFilters={plateFilters}
    />
  );
}
