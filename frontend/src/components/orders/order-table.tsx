"use client";

import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import type { Order } from "@/types/order";

export type OrderTableProps = {
  orders: Order[];
  compact?: boolean;
  onViewOrder?: (order: Order) => void;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

/** Shared responsive table for dashboard, orders, and workflow queues. */
export function OrderTable({
  orders,
  compact = false,
  onViewOrder,
}: OrderTableProps) {
  const visibleOrders = compact ? orders.slice(0, 5) : orders;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order No.</th>
            <th>Customer &amp; Product</th>
            <th>Current Process</th>
            <th>PIC</th>
            <th>Deadline</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {visibleOrders.map((order) => (
            <tr key={order.no}>
              <td>
                <strong className="order-number">{order.no}</strong>
              </td>
              <td>
                <strong>{order.customer}</strong>
                <span>{order.product}</span>
              </td>
              <td>{order.process}</td>
              <td>
                <div className="pic">
                  <span>{initials(order.pic)}</span>
                  {order.pic}
                </div>
              </td>
              <td>{order.deadline}</td>
              <td>
                <Badge tone={order.tone}>{order.status}</Badge>
              </td>
              <td>
                <button
                  type="button"
                  className="table-action"
                  aria-label={`View ${order.no}`}
                  onClick={() => onViewOrder?.(order)}
                >
                  <Icon name="chevron" size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {visibleOrders.length === 0 ? (
        <div className="empty-state">
          <div>
            <Icon name="search" />
          </div>
          <h3>No orders found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : null}
    </div>
  );
}
