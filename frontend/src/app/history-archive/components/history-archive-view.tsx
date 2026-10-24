"use client";

import { useMemo, useState } from "react";
import { OrderCard } from "@/components/workflow/order-card";
import { OrderTable } from "@/components/workflow/order-table";
import { ProjectHistoryModal } from "@/components/workflow/project-history-modal";
import { TablePagination } from "@/components/ui/table-pagination";
import { useTablePagination } from "@/components/ui/use-table-pagination";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { OrderFilters } from "@/app/orders/components/order-filters";
import type { Order } from "@/types/order";

/** Read-only archive of projects closed from the workflow. */
export function HistoryArchiveView() {
  const { orders } = useWorkflowOrders();
  const [query, setQuery] = useState("");
  const [pic, setPic] = useState("");
  const [status, setStatus] = useState("");
  const [historyOrder, setHistoryOrder] = useState<Order | null>(null);
  const archivedOrders = useMemo(
    () => orders.filter((order) =>
      order.stage === "completed" ||
      order.workflow.currentStatus === "completed" ||
      order.workflow.currentStatus === "cancelled",
    ),
    [orders],
  );
  const people = useMemo(
    () => Array.from(new Set(archivedOrders.map((order) => order.pic))).sort(),
    [archivedOrders],
  );
  const statuses = useMemo(
    () => Array.from(new Set(archivedOrders.map((order) => order.status))).sort(),
    [archivedOrders],
  );
  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    return archivedOrders.filter((order) =>
      [order.no, order.customer, order.pic].some((value) => value.toLowerCase().includes(search)) &&
      (!pic || order.pic === pic) &&
      (!status || order.status === status),
    );
  }, [archivedOrders, query, pic, status]);
  const pagination = useTablePagination(filteredOrders);

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>History &amp; Archive</h1>
          <p>View all closed projects, including completed and cancelled projects.</p>
        </div>
      </div>

      <OrderFilters
        query={query}
        pic={pic}
        status={status}
        people={people}
        statuses={statuses}
        onQueryChange={(value) => { setQuery(value); pagination.resetPage(); }}
        onPicChange={(value) => { setPic(value); pagination.resetPage(); }}
        onStatusChange={(value) => { setStatus(value); pagination.resetPage(); }}
        onClear={() => {
          setQuery("");
          setPic("");
          setStatus("");
          pagination.resetPage();
        }}
      />

      <OrderCard
        title="Closed Projects"
        subtitle={`${filteredOrders.length} of ${archivedOrders.length} closed projects found`}
      >
        <OrderTable orders={pagination.pageItems} queueLayout onViewOrder={setHistoryOrder} />
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
        <ProjectHistoryModal order={historyOrder} archiveDetails onClose={() => setHistoryOrder(null)} />
      ) : null}
    </>
  );
}
