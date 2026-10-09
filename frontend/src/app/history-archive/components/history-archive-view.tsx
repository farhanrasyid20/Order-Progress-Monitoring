"use client";

import { useMemo, useState } from "react";
import { OrderCard } from "@/components/workflow/order-card";
import { OrderTable } from "@/components/workflow/order-table";
import { ProjectHistoryModal } from "@/components/workflow/project-history-modal";
import { TablePagination } from "@/components/ui/table-pagination";
import { useTablePagination } from "@/components/ui/use-table-pagination";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import type { Order } from "@/types/order";

/** Read-only archive of projects closed from the workflow. */
export function HistoryArchiveView() {
  const { orders } = useWorkflowOrders();
  const [historyOrder, setHistoryOrder] = useState<Order | null>(null);
  const archivedOrders = useMemo(
    () => orders.filter((order) => order.stage === "completed"),
    [orders],
  );
  const pagination = useTablePagination(archivedOrders);

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
        subtitle={`${archivedOrders.length} proyek selesai atau dibatalkan`}
      >
        <OrderTable orders={pagination.pageItems} onViewOrder={setHistoryOrder} />
        <TablePagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          itemLabel="projects"
          onPageChange={pagination.goToPage}
        />
      </OrderCard>
      {historyOrder ? (
        <ProjectHistoryModal order={historyOrder} onClose={() => setHistoryOrder(null)} />
      ) : null}
    </>
  );
}
