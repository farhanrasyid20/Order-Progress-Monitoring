"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { orders } from "@/data/orders";
import { OrderTable } from "@/components/orders/order-table";
import {
  DashboardSummaryCard,
  type DashboardSummary,
} from "@/components/dashboard/dashboard-summary-card";
import { OrderProgress } from "@/components/dashboard/order-progress";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export type DashboardOverviewProps = {
  onAddOrder?: () => void;
  onViewOrders?: () => void;
};

const summaries: DashboardSummary[] = [
  {
    label: "Total Orders",
    value: "248",
    meta: "+12 this month",
    icon: "box",
    tone: "blue",
  },
  {
    label: "In Progress",
    value: "64",
    meta: "25.8% of total",
    icon: "clock",
    tone: "blue",
  },
  {
    label: "Waiting Approval",
    value: "18",
    meta: "5 require attention",
    icon: "check",
    tone: "amber",
  },
  {
    label: "Completed",
    value: "159",
    meta: "+8 this week",
    icon: "shield",
    tone: "green",
  },
  {
    label: "Overdue",
    value: "7",
    meta: "Action required",
    icon: "alert",
    tone: "red",
  },
];

/** Dashboard page content, assembled from independent dashboard components. */
export function DashboardOverview({
  onAddOrder,
  onViewOrders,
}: DashboardOverviewProps) {
  const router = useRouter();
  const goToOrders = onViewOrders ?? (() => router.push("/orders"));

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>Dashboard</h1>
          <p>Monitor order progress, deadlines, and team activity.</p>
        </div>
        <Button type="button" icon="plus" onClick={onAddOrder ?? goToOrders}>
          Add New Order
        </Button>
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
            title="Recent Orders"
            subtitle="Latest orders requiring your attention"
            action={
              <Button type="button" variant="ghost" onClick={goToOrders}>
                View all
              </Button>
            }
          />
          <OrderTable orders={orders} compact />
        </section>
        <RecentActivity />
      </div>
    </>
  );
}

export default DashboardOverview;
