"use client";

import { OffsetStageView } from "../components";
import type { QueueTableFilterConfig } from "@/components/workflow/workflow-stage-view";
import { defaultOffsetPreparationStatus, offsetPreparationStatusLabel, offsetPreparationStatusOptions } from "@/lib/offset-preparation-status";

const varnishFilters: QueueTableFilterConfig = {
  searchPlaceholder: "Search Sample Number, customer, product, varnish, or coating...",
  matchesSearch: (order, query) => !query || [order.no, order.customer, order.product, order.mainData.varnish, order.mainData.coatingSide].some((value) => value?.toLowerCase().includes(query)),
  filters: [
    { key: "varnish", label: "Varnish", valuesFor: (orders) => orders.map((order) => order.mainData.varnish ?? ""), matches: (order, value) => order.mainData.varnish === value },
    { key: "coatingSide", label: "Coating Side", valuesFor: (orders) => orders.map((order) => order.mainData.coatingSide ?? ""), matches: (order, value) => order.mainData.coatingSide === value },
    { key: "status", label: "Status", valuesFor: () => offsetPreparationStatusOptions.map((option) => option.label), matches: (order, value) => offsetPreparationStatusLabel(order.offsetVarnish?.status ?? defaultOffsetPreparationStatus) === value },
  ],
};

export default function OffsetVarnishPage() {
  return (
    <OffsetStageView
      stage="offset-varnish"
      title="Block / Spot Varnish"
      copy="Monitor Block / Spot Varnish readiness independently alongside Material and Tooling."
      queueTitle="Block / Spot Varnish Queue"
      queueCopy="Submitted Varnish monitoring requirements for Offset projects"
      nextLabel="Press / Printing"
      queueTableFilters={varnishFilters}
    />
  );
}
