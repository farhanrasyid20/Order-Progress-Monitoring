import { formatRecordedAt } from "@/lib/detail-date";
import { OffsetProjectDetails } from "./offset-project-details";
import type { Order, RequirementRecord, RequirementStatus, StandaloneRequirementKind } from "@/types/order";

const statusLabels: Record<RequirementStatus, string> = {
  needed: "Needed", ordered: "Ordered", received: "Received",
  available: "Available / Existing", on_hold: "On Hold", repair: "Repair",
  issue: "Issue / Reorder", cancelled: "Cancelled",
};

export function DetailGrid({ fields }: { fields: [string, string | null | undefined][] }) {
  return <dl className="incoming-detail-grid">
    {fields.map(([label, value]) => <div key={label}>
      <dt>{label}</dt><dd>{label === "Recorded At" ? formatRecordedAt(value) : value?.trim() || "-"}</dd>
    </div>)}
  </dl>;
}

function RecordDetails({ record, kind }: { record: RequirementRecord; kind: StandaloneRequirementKind }) {
  return <DetailGrid fields={[
    [kind === "tooling" ? "Tooling Type" : "Requirement Type", record.requirementType],
    ["Status", statusLabels[record.status] ?? record.status],
    ["Order By / PIC", record.requestedBy],
    ["Order Date", record.orderDate],
    ["Expected Arrival Date", record.expectedDate],
    ["Received Date", record.arrivalDate],
    ["Supplier / Vendor", record.supplier],
    ["Invoice Number", record.invoiceNumber],
    ["Price (IDR)", record.price],
    ["Remark", record.remark],
  ]} />;
}

export function RequirementDetails({ order, kind, showProject = true, showPrevious = true }: { order: Order; kind: StandaloneRequirementKind; showProject?: boolean; showPrevious?: boolean }) {
  const records = kind === "tooling" ? order.toolingOrders : order.rubberOrders;
  const latest = records.at(-1);
  const label = kind === "tooling" ? "Tooling" : "Rubber";
  const preparationLabels = { tooling: "Order Tooling", rubber: "Order Rubber", tooling_and_rubber: "Order Tooling & Rubber" };

  return <>
    {showProject && order.workflow.preparationType === "offset" ? <OffsetProjectDetails order={order} /> : null}
    {showProject && order.workflow.preparationType !== "offset" ? <section className="requirement-detail-section" aria-label="Project information">
      <h3>Project Information</h3>
      <DetailGrid fields={[
        ["PSR / Code", order.no], ["Customer", order.customer],
        ["Product / Component", order.product], ["Material", order.material],
        ["Description", order.description], ["Designer / PIC", order.pic],
        ["Project Date", order.projectDate], ["Deadline", order.deadline],
        ["Preparation", order.workflow.productionOrder ? preparationLabels[order.workflow.productionOrder] : "-"],
        ["Forwarded to Material Request / MI", (kind === "tooling" ? order.workflow.toolingForwarded : order.workflow.rubberForwarded) ? "Yes" : "No"],
      ]} />
      {order.workflow.drawingLink ? <a className="drawing-link" href={order.workflow.drawingLink} target="_blank" rel="noopener noreferrer">Open Drawing</a> : null}
    </section> : null}
    <section className="requirement-detail-section" aria-label={`${label} input details`}>
      <h3>{label} Details — Latest Input</h3>
      {latest ? <RecordDetails record={latest} kind={kind} /> : (
        <div className="material-details-empty" role="status">
          <p>No {label.toLowerCase()} details have been recorded.</p>
        </div>
      )}
    </section>
    {showPrevious && records.length > 1 ? <section className="requirement-detail-section">
      <h3>Previous {label} Inputs</h3>
      {records.slice(0, -1).reverse().map((record) => <details key={record.sequence} className="requirement-detail-version">
        <summary>Input #{record.sequence} / {record.requirementType} / {statusLabels[record.status]}</summary>
        <RecordDetails record={record} kind={kind} />
      </details>)}
    </section> : null}
  </>;
}
