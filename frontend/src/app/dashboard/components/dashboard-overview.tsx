"use client";

import { useMemo } from "react";
import { useIssues } from "@/components/issues/issue-provider";
import { buildRecentActivity } from "@/lib/recent-activity";
import { useRouter } from "next/navigation";
import { DesignerWorkload } from "./designer-workload";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import {
  DashboardSummaryCard,
  type DashboardSummary,
} from "./dashboard-summary-card";
import { OrderProgress } from "./order-progress";
import { RecentActivity } from "./recent-activity";

export type DashboardOverviewProps = {
  onViewOrders?: () => void;
};

const summaries: DashboardSummary[] = [
  {
    label: "Incoming Design",
    value: "18",
    meta: "2 new today",
    icon: "box",
    tone: "blue",
  },
  {
    label: "Design Process",
    value: "7",
    meta: "2 nearing deadline",
    icon: "pen",
    tone: "blue",
  },
  {
    label: "Sample in Progress",
    value: "6",
    meta: "1 waiting for material",
    icon: "flask",
    tone: "amber",
  },
  {
    label: "Sample Completed",
    value: "12",
    meta: "This month",
    icon: "check",
    tone: "green",
  },
  {
    label: "Ready for Order",
    value: "8",
    meta: "This month",
    icon: "box",
    tone: "green",
  },
];

/** Dashboard page content, assembled from independent dashboard components. */
export function DashboardOverview({
  onViewOrders,
}: DashboardOverviewProps) {
  const router = useRouter();
  const { orders } = useWorkflowOrders();
  const { issues } = useIssues();
  const recentActivity = useMemo(() => buildRecentActivity(orders, issues), [orders, issues]);
  const goToOrders = onViewOrders ?? (() => router.push("/orders"));

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>Workload Design &amp; Tooling</h1>
          <p>Monitor projects from incoming design through sample completion.</p>
        </div>
      </div>

      <div className="summary-grid">
        {summaries.map((summary) => (
          <DashboardSummaryCard key={summary.label} summary={summary} />
        ))}
      </div>

      <OrderProgress onViewOrders={goToOrders} />

      <div className="content-grid">
        <DesignerWorkload orders={orders} />
        <RecentActivity items={recentActivity} />
      </div>
    </>
  );
}

export default DashboardOverview;
