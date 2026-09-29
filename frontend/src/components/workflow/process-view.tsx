"use client";

import { Button } from "@/components/ui/button";
import type { IconName } from "@/components/ui/icon";
import { orders } from "@/data/orders";
import type { Order } from "@/types/order";
import { OrderCard } from "@/components/orders/order-card";
import { OrderTable } from "@/components/orders/order-table";
import { ProcessSummary } from "@/components/workflow/process-summary";

export type ProcessKey =
  | "design-drawing"
  | "review-approval"
  | "sample"
  | "quality-control"
  | "reports"
  | "users"
  | "settings";

type ProcessConfig = {
  title: string;
  copy: string;
  icon: IconName;
  action: string;
  actionIcon: IconName;
};

export const processConfigs: Record<ProcessKey, ProcessConfig> = {
  "design-drawing": {
    title: "Design & Drawing",
    copy: "Manage assigned drawings and design submissions.",
    icon: "pen",
    action: "Upload Drawing",
    actionIcon: "plus",
  },
  "review-approval": {
    title: "Review & Approval",
    copy: "Review submitted drawings and manage approvals.",
    icon: "check",
    action: "Review Queue",
    actionIcon: "plus",
  },
  sample: {
    title: "Sample Tracking",
    copy: "Monitor sample creation, revisions, and completion.",
    icon: "flask",
    action: "Update Sample",
    actionIcon: "plus",
  },
  "quality-control": {
    title: "Quality Control",
    copy: "Inspect samples and record quality results.",
    icon: "shield",
    action: "New Inspection",
    actionIcon: "plus",
  },
  reports: {
    title: "Reports",
    copy: "Review operational performance and order outcomes.",
    icon: "report",
    action: "Export Report",
    actionIcon: "download",
  },
  users: {
    title: "User Management",
    copy: "Manage users, roles, and access permissions.",
    icon: "users",
    action: "Add User",
    actionIcon: "plus",
  },
  settings: {
    title: "Settings",
    copy: "Configure workspace preferences and notifications.",
    icon: "settings",
    action: "Save Settings",
    actionIcon: "settings",
  },
};

export type ProcessViewProps = {
  processKey: ProcessKey;
  onAction?: () => void;
  onFilter?: () => void;
  onViewOrder?: (order: Order) => void;
};

/** Shared page for all workflow stages, configured through `processKey`. */
export function ProcessView({
  processKey,
  onAction,
  onFilter,
  onViewOrder,
}: ProcessViewProps) {
  const current = processConfigs[processKey];

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>{current.title}</h1>
          <p>{current.copy}</p>
        </div>
        <Button type="button" icon={current.actionIcon} onClick={onAction}>
          {current.action}
        </Button>
      </div>

      <ProcessSummary icon={current.icon} />

      <OrderCard
        title={`${current.title} Queue`}
        subtitle="Items sorted by nearest deadline"
        action={
          <Button type="button" variant="secondary" onClick={onFilter}>
            Filter
          </Button>
        }
      >
        <OrderTable orders={orders} onViewOrder={onViewOrder} />
      </OrderCard>
    </>
  );
}

export default ProcessView;
