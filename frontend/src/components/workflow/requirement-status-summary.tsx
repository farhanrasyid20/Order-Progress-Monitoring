import { Icon, type IconName } from "@/components/ui/icon";
import type { Order, StandaloneRequirementKind } from "@/types/order";

const statuses = [
  { value: "ordered", label: "Ordered" },
  { value: "received", label: "Received" },
  { value: "available", label: "Available / Existing" },
] as const;

export function RequirementStatusSummary({ orders, kind, icon }: {
  orders: Order[];
  kind: StandaloneRequirementKind;
  icon: IconName;
}) {
  return (
    <div className="summary-grid requirement-status-summary">
      {statuses.map(({ value, label }) => (
        <article className="summary-card" key={value}>
          <div className={`summary-icon ${value === "ordered" ? "blue" : "green"}`}>
            <Icon name={icon} />
          </div>
          <div className="summary-label">{label}</div>
          <strong className="summary-value">
            {orders.filter(order => (kind === "tooling" ? order.toolingOrders : order.rubberOrders).at(-1)?.status === value).length}
          </strong>
          <span className="summary-meta">{kind === "tooling" ? "Tooling" : "Rubber"} orders</span>
        </article>
      ))}
    </div>
  );
}
