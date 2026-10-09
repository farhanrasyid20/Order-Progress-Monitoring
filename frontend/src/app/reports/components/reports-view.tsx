"use client";

import { useMemo, useState } from "react";
import { OrderCard } from "@/components/workflow/order-card";
import { OrderTable } from "@/components/workflow/order-table";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { TablePagination } from "@/components/ui/table-pagination";
import { useTablePagination } from "@/components/ui/use-table-pagination";

/** Read-only reporting feature. Records are edited in their workflow stage. */
export function ReportsView() {
  const { orders } = useWorkflowOrders();
  const [hasExported, setHasExported] = useState(false);
  const completedOrders = useMemo(
    () => orders.filter((order) => order.stage === "completed"),
    [orders],
  );
  const pagination = useTablePagination(completedOrders);

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>Reports</h1>
          <p>Review completed order outcomes and export operational data.</p>
        </div>
        <Button
          type="button"
          icon="download"
          onClick={() => setHasExported(true)}
        >
          {hasExported ? "Export Ready" : "Export Report"}
        </Button>
      </div>

      <div className="summary-grid process-summary reports-summary">
        <article className="summary-card">
          <div className="summary-icon green">
            <Icon name="check" />
          </div>
          <div className="summary-label">Completed orders</div>
          <strong className="summary-value">{completedOrders.length}</strong>
          <span className="summary-meta">Available in this report</span>
        </article>
        <article className="summary-card">
          <div className="summary-icon blue">
            <Icon name="box" />
          </div>
          <div className="summary-label">All tracked orders</div>
          <strong className="summary-value">{orders.length}</strong>
          <span className="summary-meta">Across all workflow stages</span>
        </article>
      </div>

      <OrderCard
        title="Completed Orders"
        subtitle="Read-only results; update an item in its active workflow stage"
      >
        <OrderTable orders={pagination.pageItems} />
        <TablePagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          itemLabel="orders"
          onPageChange={pagination.goToPage}
        />
      </OrderCard>
    </>
  );
}
