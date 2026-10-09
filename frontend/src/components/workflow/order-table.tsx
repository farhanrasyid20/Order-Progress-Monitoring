"use client";

import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import type { Order } from "@/types/order";

export type OrderTableProps = {
  orders: Order[];
  compact?: boolean;
  onViewOrder?: (order: Order) => void;
  onEditOrder?: (order: Order) => void;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

function priorityTone(priority: Order["priority"]) {
  if (priority === "High") return "danger";
  if (priority === "Medium") return "warning";
  return "success";
}

function routeLabel(order: Order) {
  if (order.workflow.preparationType === "offset") {
    return "Offset";
  }

  return order.workflow.convertingRoute === "by_production"
    ? "Converting / By Production"
    : "Converting / By Design";
}

/** Shared responsive table for dashboard, orders, and workflow queues. */
export function OrderTable({
  orders,
  compact = false,
  onViewOrder,
  onEditOrder,
}: OrderTableProps) {
  const visibleOrders = compact ? orders.slice(0, 5) : orders;
  const hasActions = Boolean(onEditOrder || onViewOrder);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>PSR / Code</th>
            <th>Customer &amp; Product</th>
            {!compact ? <th>Description</th> : null}
            {!compact ? <th>Material</th> : null}
            {!compact ? <th>Route</th> : null}
            <th>Current Process</th>
            <th>Designer</th>
            <th>Deadline</th>
            {!compact ? <th>Drawing Link</th> : null}
            {!compact ? <th>Priority</th> : null}
            {!compact ? <th>Progress</th> : null}
            <th>Status</th>
            {hasActions ? <th scope="col">Action</th> : null}
          </tr>
        </thead>
        <tbody>
          {visibleOrders.map((order) => (
            <tr key={order.no}>
              <td>
                <strong className="order-number">{order.no}</strong>
                {order.mainData.partNo && order.mainData.partNo !== order.no ? (
                  <span>{order.mainData.partNo}</span>
                ) : null}
              </td>
              <td>
                <strong>{order.customer}</strong>
                <span>{order.product}</span>
              </td>
              {!compact ? <td>{order.description}</td> : null}
              {!compact ? <td>{order.material}</td> : null}
              {!compact ? <td>{routeLabel(order)}</td> : null}
              <td>{order.process}</td>
              <td>
                <div className="pic">
                  <span>{initials(order.pic)}</span>
                  {order.pic}
                </div>
              </td>
              <td>{order.deadline}</td>
              {!compact ? (
                <td>
                  {order.workflow.drawingLink ? (
                    <a
                      className="drawing-link"
                      href={order.workflow.drawingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Drawing
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
              ) : null}
              {!compact ? (
                <td>
                  <Badge tone={priorityTone(order.priority)}>{order.priority}</Badge>
                </td>
              ) : null}
              {!compact ? (
                <td>
                  <div className="table-progress" aria-label={`${order.progress}% complete`}>
                    <span style={{ width: `${order.progress}%` }} />
                  </div>
                  <small className="table-progress-label">{order.progress}%</small>
                </td>
              ) : null}
              <td>
                <Badge tone={order.tone}>{order.status}</Badge>
              </td>
              {hasActions ? (
                <td>
                  <div className="table-actions">
                    {onViewOrder ? (
                      <button
                        type="button"
                        className="table-action"
                        aria-label={`View details and history for ${order.no}`}
                        onClick={() => onViewOrder(order)}
                      >
                        <Icon name="eye" size={16} />
                      </button>
                    ) : null}
                    {onEditOrder ? (
                      <button
                        type="button"
                        className="table-action"
                        aria-label={`Edit ${order.no}`}
                        onClick={() => onEditOrder(order)}
                      >
                        <Icon name="pen" size={16} />
                      </button>
                    ) : null}
                  </div>
                </td>
              ) : null}
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
          <p>Try adjusting the search or filters.</p>
        </div>
      ) : null}
    </div>
  );
}
