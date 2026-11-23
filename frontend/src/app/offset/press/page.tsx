"use client";

import { OffsetStageView } from "../components";
import type { QueueTableFilterConfig } from "@/components/workflow/workflow-stage-view";

const pressFilters: QueueTableFilterConfig = {
  searchPlaceholder: "Search Sample Number, customer, product, machine, or colors...",
  matchesSearch: (order, query) => !query || [order.no, order.customer, order.product, order.mainData.printingMachine, order.mainData.colours, order.mainData.printingSide].some((value) => value?.toLowerCase().includes(query)),
  filters: [
    { key: "machine", label: "Machine", valuesFor: (orders) => orders.map((order) => order.mainData.printingMachine ?? ""), matches: (order, value) => order.mainData.printingMachine === value },
    { key: "printingSide", label: "Printing Side", valuesFor: (orders) => orders.map((order) => order.mainData.printingSide ?? ""), matches: (order, value) => order.mainData.printingSide === value },
  ],
};

export default function OffsetPressPage() {
  return (
    <OffsetStageView
      stage="offset-press"
      title="Press / Printing"
      copy="Manage Offset printing before quality control inspection."
      queueTitle="Press / Printing Queue"
      queueCopy="Offset jobs with completed plate and varnish preparation"
      nextLabel="QC Checking"
      queueTableFilters={pressFilters}
    />
  );
}
