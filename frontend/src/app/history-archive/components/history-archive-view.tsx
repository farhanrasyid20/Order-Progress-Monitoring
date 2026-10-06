"use client";

import { useMemo } from "react";
import { OrderCard } from "@/components/workflow/order-card";
import { OrderTable } from "@/components/workflow/order-table";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";

/** Read-only archive of projects closed from the workflow. */
export function HistoryArchiveView() {
  const { orders } = useWorkflowOrders();
  const archivedOrders = useMemo(
    () => orders.filter((order) => order.stage === "completed"),
    [orders],
  );

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>History &amp; Archive</h1>
          <p>Riwayat proyek yang telah selesai atau ditutup.</p>
        </div>
      </div>

      <OrderCard
        title="Arsip Proyek"
        subtitle={`${archivedOrders.length} proyek telah diarsipkan`}
      >
        <OrderTable orders={archivedOrders} />
      </OrderCard>
    </>
  );
}
