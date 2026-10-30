"use client";

import { useMemo } from "react";
import { useIssues } from "@/components/issues/issue-provider";
import { buildRecentActivity } from "@/lib/recent-activity";
import { DesignerWorkload } from "./designer-workload";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { RecentActivity } from "./recent-activity";

/** Dashboard page content, assembled from independent dashboard components. */
export function DashboardOverview() {
  const { orders } = useWorkflowOrders();
  const { issues } = useIssues();
  const recentActivity = useMemo(() => buildRecentActivity(orders, issues), [orders, issues]);

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>Workload Design &amp; Tooling</h1>
          <p>Monitor projects from incoming design through sample completion.</p>
        </div>
      </div>

      <div className="content-grid">
        <DesignerWorkload orders={orders} />
        <RecentActivity items={recentActivity} />
      </div>
    </>
  );
}

export default DashboardOverview;
