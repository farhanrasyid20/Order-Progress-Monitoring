"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { orders } from "@/data/orders";
import type { Order } from "@/types/order";
import { OrderCard } from "@/components/orders/order-card";
import { OrderFilters } from "@/components/orders/order-filters";
import { OrderPagination } from "@/components/orders/order-pagination";
import { OrderTable } from "@/components/orders/order-table";

const pageSize = 5;

export type OrdersViewProps = {
  onAddOrder?: () => void;
  onExport?: () => void;
  onViewOrder?: (order: Order) => void;
};

/** Full order-management feature composed from filters, table, card, and pager. */
export function OrdersView({
  onAddOrder,
  onExport,
  onViewOrder,
}: OrdersViewProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [process, setProcess] = useState("");
  const [pic, setPic] = useState("");
  const [page, setPage] = useState(1);

  const statuses = useMemo(
    () => Array.from(new Set(orders.map((order) => order.status))),
    [],
  );
  const processes = useMemo(
    () => Array.from(new Set(orders.map((order) => order.process))),
    [],
  );
  const people = useMemo(
    () => Array.from(new Set(orders.map((order) => order.pic))),
    [],
  );
  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesQuery = `${order.no} ${order.customer} ${order.product}`
        .toLowerCase()
        .includes(normalizedQuery);

      return (
        matchesQuery &&
        (!status || order.status === status) &&
        (!process || order.process === process) &&
        (!pic || order.pic === pic)
      );
    });
  }, [pic, process, query, status]);

  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageOrders = filteredOrders.slice(start, start + pageSize);

  const resetPage = () => setPage(1);
  const clearFilters = () => {
    setQuery("");
    setStatus("");
    setProcess("");
    setPic("");
    resetPage();
  };

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>Order Management</h1>
          <p>Track and manage all customer orders in one place.</p>
        </div>
        <Button type="button" icon="plus" onClick={onAddOrder}>
          Add New Order
        </Button>
      </div>

      <OrderFilters
        query={query}
        status={status}
        process={process}
        pic={pic}
        statuses={statuses}
        processes={processes}
        people={people}
        onQueryChange={(value) => {
          setQuery(value);
          resetPage();
        }}
        onStatusChange={(value) => {
          setStatus(value);
          resetPage();
        }}
        onProcessChange={(value) => {
          setProcess(value);
          resetPage();
        }}
        onPicChange={(value) => {
          setPic(value);
          resetPage();
        }}
        onClear={clearFilters}
      />

      <OrderCard
        title="All Orders"
        subtitle={`${filteredOrders.length} orders found`}
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
        <OrderTable orders={pageOrders} onViewOrder={onViewOrder} />
        <OrderPagination
          page={currentPage}
          pageCount={pageCount}
          totalItems={filteredOrders.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </OrderCard>
    </>
  );
}

export default OrdersView;
