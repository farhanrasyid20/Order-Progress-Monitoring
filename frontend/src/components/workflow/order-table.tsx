"use client";

import { DEFAULT_TABLE_PAGE_SIZE } from "@/components/ui/use-table-pagination";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { englishOffsetLabel } from "@/lib/offset-labels";
import type { Order, StandaloneRequirementKind } from "@/types/order";

export type OrderTableProps = {
  orders: Order[];
  compact?: boolean;
  queueLayout?: boolean;
  editActionLabel?: string;
  requirementKind?: StandaloneRequirementKind;
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
  queueLayout = false,
  editActionLabel,
  requirementKind,
  onViewOrder,
  onEditOrder,
}: OrderTableProps) {
  const visibleOrders = compact ? orders.slice(0, DEFAULT_TABLE_PAGE_SIZE) : orders;
  const hasActions = Boolean(onEditOrder || onViewOrder);

  const actionCell = (order: Order) => (
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
            className={editActionLabel && !queueLayout ? "button button-secondary" : "table-action"}
            aria-label={`${editActionLabel ?? "Edit"} ${order.no}`}
            title={editActionLabel ?? "Edit"}
            onClick={() => onEditOrder(order)}
          >
            <Icon name="pen" size={16} />
            {!queueLayout ? editActionLabel : null}
          </button>
        ) : null}
      </div>
    </td>
  );

  if (queueLayout) return (
    <div className="table-wrap">
      <table className="workflow-queue-table">
        <colgroup>
          <col style={{ width: "10%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "17%" }} />
          <col style={{ width: "23%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "11%" }} />
        </colgroup>
        <thead><tr>
          <th scope="col">Action</th><th scope="col">Status</th><th scope="col">PSR / Code</th>
          <th scope="col">Current Process</th><th scope="col">Customer &amp; Product</th>
          <th scope="col">Designer</th><th scope="col">Deadline</th>
        </tr></thead>
        <tbody>{visibleOrders.map(order => <tr key={`${order.id}-${order.materialRequestSource ?? "project"}`}>
          {actionCell(order)}
          <td><Badge tone={order.tone}>{order.status}</Badge></td>
          <td><strong className="order-number">{order.no}</strong>{order.requirementBranch ? <span>{order.requirementBranch === "tooling" ? "Tooling" : "Rubber"}</span> : null}</td>
          <td>{englishOffsetLabel(order.process)}</td>
          <td><strong>{order.customer}</strong><span>{order.product}</span></td>
          <td>{order.pic}</td>
          <td>{order.deadline}</td>
        </tr>)}</tbody>
      </table>
      {visibleOrders.length === 0 ? <div className="empty-state">
        <div><Icon name="search" /></div><h3>No orders found</h3><p>Try adjusting the search or filters.</p>
      </div> : null}
    </div>
  );

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
            {requirementKind ? <><th>Invoice Number</th><th>Price</th></> : null}
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
            <tr key={`${order.id}-${order.materialRequestSource ?? "project"}`}>
              <td>
                <strong className="order-number">{order.no}</strong>
                {order.materialRequestSource ? <span>{order.materialRequestSource === "tooling" ? "Tooling" : "Rubber"}</span> : null}
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
              <td>{englishOffsetLabel(order.process)}</td>
              <td>
                <div className="pic">
                  <span>{initials(order.pic)}</span>
                  {order.pic}
                </div>
              </td>
              {requirementKind ? <>
                <td>{(requirementKind === "tooling" ? order.toolingOrders : order.rubberOrders).at(-1)?.invoiceNumber || "-"}</td>
                <td>{(requirementKind === "tooling" ? order.toolingOrders : order.rubberOrders).at(-1)?.price || "-"}</td>
              </> : null}
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
              {hasActions ? actionCell(order) : null}
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
