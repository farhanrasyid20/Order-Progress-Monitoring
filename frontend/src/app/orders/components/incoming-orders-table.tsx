"use client";

import { workflowStageDetails } from "@/components/workflow/workflow-provider";
import { Icon } from "@/components/ui/icon";
import type { Order } from "@/types/order";

export type IncomingOrdersTableProps = {
  orders: Order[];
  onShowDetails: (order: Order) => void;
};

type PreparationCheck = {
  label: string;
  state: "complete" | "pending" | "empty";
};

function workflowStatusLabel(order: Order) {
  if (order.stage === "order") {
    return order.lineage.entryType === "version_up"
      ? "New Project / Version Up"
      : "New Project";
  }

  return workflowStageDetails[order.stage]?.process ?? order.process;
}

function displayLastUpdate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value || "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function productionDesignLabel(order: Order) {
  if (order.workflow.preparationType === "offset") return "Offset: Production";
  if (order.workflow.convertingRoute === "by_production") return "Converting: Production";
  if (order.workflow.convertingRoute === "by_design") return "Converting: Design";

  return "-";
}

function stateFor(
  hasDetails: boolean,
  isSelected: boolean,
): PreparationCheck["state"] {
  if (hasDetails) return "complete";
  return isSelected ? "pending" : "empty";
}

function preparationChecks(order: Order): PreparationCheck[] {
  const taskOrders = order.workflow.preparationOrders ?? [];
  const selected = (kind: "tooling" | "rubber") =>
    order.workflow.productionOrder === kind ||
    order.workflow.productionOrder === "tooling_and_rubber" ||
    taskOrders.includes(kind);

  if (order.workflow.preparationType === "offset") {
    return [
      {
        label: "Req. Material",
        state: order.workflow.materialRequested ? "complete" : "empty",
      },
    ];
  }

  if (order.workflow.convertingRoute === "by_design") {
    return [{
      label: "Req. Material",
      state: order.workflow.materialRequested ? "complete" : "empty",
    }];
  }

  return [
    {
      label: "Tooling",
      state: stateFor(
        order.toolingOrders.length > 0,
        selected("tooling"),
      ),
    },
    {
      label: "Rubber",
      state: stateFor(
        order.rubberOrders.length > 0,
        selected("rubber"),
      ),
    },
    {
      label: "Req. Material",
      state: order.workflow.materialRequested ? "complete" : "empty",
    },
  ];
}

function PreparationChecklist({ order }: { order: Order }) {
  return (
    <div className="preparation-checklist" aria-label={`Preparation status for ${order.no}`}>
      {preparationChecks(order).map((check) => (
        <span className={`preparation-check preparation-check-${check.state}`} key={check.label}>
          {check.state === "complete" ? <Icon name="check" size={12} /> : null}
          {check.state === "pending" ? <Icon name="clock" size={12} /> : null}
          {check.state === "empty" ? <span aria-hidden="true">—</span> : null}
          {check.label}
        </span>
      ))}
    </div>
  );
}

export function IncomingOrdersTable({ orders, onShowDetails }: IncomingOrdersTableProps) {
  return <div className="table-wrap">
    <table className="incoming-orders-table">
      <thead><tr>
        <th>Action</th><th>Status</th><th>Preparation Check</th><th>PSR / Code</th><th>Production / Design</th>
        <th>Customer &amp; Product</th><th>PIC</th><th>Deadline</th>
      </tr></thead>
      <tbody>{orders.map((order) => <tr key={order.id}>
        <td>
          <button
            type="button"
            className="table-detail-button table-detail-button-compact"
            onClick={() => onShowDetails(order)}
            aria-label={`Open details for ${order.no}`}
            title="Open details"
          >
            <Icon name="eye" size={15} />
            <span className="sr-only">Details</span>
          </button>
        </td>
        <td className="incoming-status-cell">
          <strong>{workflowStatusLabel(order)}</strong>
          <span>Last update: {displayLastUpdate(order.updatedAt)}</span>
        </td>
        <td><PreparationChecklist order={order} /></td>
        <td><strong className="order-number">{order.no}</strong></td>
        <td>{productionDesignLabel(order)}</td>
        <td><strong>{order.customer}</strong><span>{order.product}</span></td>
        <td>{order.pic}</td><td>{order.deadline}</td>
      </tr>)}</tbody>
    </table>
    {orders.length === 0 ? <div className="empty-state"><div><Icon name="search" /></div><h3>No projects found</h3><p>Try adjusting the workflow or project filters.</p></div> : null}
  </div>;
}

export default IncomingOrdersTable;
