"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { TablePagination } from "@/components/ui/table-pagination";
import { useTablePagination } from "@/components/ui/use-table-pagination";
import type { Order } from "@/types/order";
import { OrderCard } from "@/components/workflow/order-card";
import { OrderFilters } from "./order-filters";
import { AddProjectModal } from "./add-project-modal";
import { CancelProjectModal } from "./cancel-project-modal";
import { IncomingOrdersTable } from "./incoming-orders-table";
import { OrderHistoryModal } from "./order-history-modal";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";

export type OrdersViewProps = {
  initialAddModalOpen?: boolean;
  onAddOrder?: () => void;
  onExport?: () => void;
};

/** Design Masuk feature composed from project filters, table, and modal forms. */
export function OrdersView({
  initialAddModalOpen = false,
  onAddOrder,
  onExport,
}: OrdersViewProps) {
  const {
    orders,
    addProject,
    cancelIncomingProject,
    completeDesignDecision,
    completeIncomingPreparation,
  } = useWorkflowOrders();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [pic, setPic] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialAddModalOpen);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [pendingHistoryOrderNo, setPendingHistoryOrderNo] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (!initialAddModalOpen) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.get("create") !== "1") {
      return;
    }

    searchParams.delete("create");
    const query = searchParams.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
  }, [initialAddModalOpen]);

  const incomingOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.stage === "order" || order.stage === "review-approval",
      ),
    [orders],
  );
  const statuses = useMemo(
    () => Array.from(new Set([...incomingOrders.map((order) => order.status), "Cancelled"])),
    [incomingOrders],
  );
  const people = useMemo(
    () => Array.from(new Set(incomingOrders.map((order) => order.pic))),
    [incomingOrders],
  );
  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return incomingOrders.filter((order) => {
      const isCancelled = order.workflow.currentStatus === "cancelled";
      const matchesQuery = `${order.no} ${order.customer} ${order.product} ${order.pic} ${order.description}`
        .toLowerCase()
        .includes(normalizedQuery);

      return (
        matchesQuery &&
        (!status ? !isCancelled : order.status === status) &&
        (!pic || order.pic === pic)
      );
    });
  }, [incomingOrders, pic, query, status]);

  const pagination = useTablePagination(filteredOrders);
  const updatedHistoryOrder = pendingHistoryOrderNo
    ? orders.find((order) => order.no === pendingHistoryOrderNo) ?? null
    : null;
  const visibleDetailOrder = detailOrder ?? updatedHistoryOrder;

  const resetPage = pagination.resetPage;
  const clearFilters = () => {
    setQuery("");
    setStatus("");
    setPic("");
    resetPage();
  };

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>Incoming Design</h1>
          <p>Manage design requests, drawing links, and design decisions.</p>
        </div>
        <a
          className="button button-primary"
          href="/orders?create=1"
          onClick={onAddOrder}
        >
          <Icon name="plus" size={16} />
          Add Project
        </a>
      </div>

      <OrderFilters
        query={query}
        status={status}
        pic={pic}
        statuses={statuses}
        people={people}
        onQueryChange={(value) => {
          setQuery(value);
          resetPage();
        }}
        onStatusChange={(value) => {
          setStatus(value);
          resetPage();
        }}
        onPicChange={(value) => {
          setPic(value);
          resetPage();
        }}
        onClear={clearFilters}
      />

      <OrderCard
        title="Active Projects"
        subtitle={`${filteredOrders.length} projects found`}
        action={
          <Button
            type="button"
            variant="secondary"
            icon="download"
            onClick={onExport}
          >
            Export
          </Button>
        }
      >
        <IncomingOrdersTable
          orders={pagination.pageItems}
          onShowDetails={(order) => {
            setPendingHistoryOrderNo(null);
            setDetailOrder(order);
          }}
          onCancel={(order) => {
            setPendingHistoryOrderNo(null);
            setCancellingOrder(order);
          }}
          onUpdatePreparation={(orderNo, values) => {
            completeIncomingPreparation(orderNo, values);
            resetPage();
            setPendingHistoryOrderNo(orderNo);
            setToastMessage(
              `Preparation for ${orderNo} was updated and moved to Design Process.`,
            );
            window.setTimeout(() => setToastMessage(""), 3200);
          }}
          onCompleteDesignDecision={(orderNo, decision) => {
            completeDesignDecision(orderNo, decision);
            resetPage();
            setPendingHistoryOrderNo(orderNo);
            setToastMessage(
              `Design decision for ${orderNo} was set to ${
                decision === "approve" ? "Approve" : "Revision"
              }.`,
            );
            window.setTimeout(() => setToastMessage(""), 3200);
          }}
        />
        <TablePagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          itemLabel="projects"
          onPageChange={pagination.goToPage}
        />
      </OrderCard>

      {isAddModalOpen ? (
        <AddProjectModal
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={(values) => {
            addProject(values);
            setIsAddModalOpen(false);
            resetPage();
            setToastMessage("Project added successfully.");
            window.setTimeout(() => setToastMessage(""), 3200);
          }}
        />
      ) : null}

      {cancellingOrder ? (
        <CancelProjectModal
          onClose={() => setCancellingOrder(null)}
          onConfirm={(reason) => {
            cancelIncomingProject(cancellingOrder.no, reason);
            setCancellingOrder(null);
            resetPage();
            setPendingHistoryOrderNo(cancellingOrder.no);
            setToastMessage(`Project ${cancellingOrder.no} was cancelled.`);
            window.setTimeout(() => setToastMessage(""), 3200);
          }}
        />
      ) : null}

      {visibleDetailOrder ? (
        <OrderHistoryModal
          order={visibleDetailOrder}
          onClose={() => {
            setDetailOrder(null);
            setPendingHistoryOrderNo(null);
          }}
        />
      ) : null}

      {toastMessage ? (
        <div className="toast-message" role="status">
          {toastMessage}
        </div>
      ) : null}
    </>
  );
}

export default OrdersView;
