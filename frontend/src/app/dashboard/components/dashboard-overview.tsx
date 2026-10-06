"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SectionHeader } from "@/components/ui/section-header";
import { OrderTable } from "@/components/workflow/order-table";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import {
  DashboardSummaryCard,
  type DashboardSummary,
} from "./dashboard-summary-card";
import { OrderProgress } from "./order-progress";
import { RecentActivity } from "./recent-activity";

export type DashboardOverviewProps = {
  onAddOrder?: () => void;
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
  onAddOrder,
  onViewOrders,
}: DashboardOverviewProps) {
  const router = useRouter();
  const { orders } = useWorkflowOrders();
  const goToOrders = onViewOrders ?? (() => router.push("/orders"));
  const activeOrders = orders.filter(
    (order) =>
      order.stage !== "completed" && order.workflow.currentStatus !== "cancelled",
  );

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>Workload Design &amp; Tooling</h1>
          <p>Monitor projects from incoming design through sample completion.</p>
        </div>
        <Link
          href="/orders?create=1"
          className="button button-primary"
          onClick={onAddOrder}
        >
          <Icon name="plus" size={16} />
          Add Project
        </Link>
      </div>

      <div className="summary-grid">
        {summaries.map((summary) => (
          <DashboardSummaryCard key={summary.label} summary={summary} />
        ))}
      </div>

      <OrderProgress onViewOrders={goToOrders} />

      <div className="content-grid">
        <section className="card orders-card">
          <SectionHeader
            title="Active Projects"
            subtitle="Projects that need monitoring"
            action={
              <Button type="button" variant="ghost" onClick={goToOrders}>
                View All
              </Button>
            }
          />
          <OrderTable orders={activeOrders} compact />
        </section>
        <RecentActivity />
      </div>
    </>
  );
}

export default DashboardOverview;
