import type { MaterialRequestRecord, MaterialRequestStatus, Order, StandaloneRequirementKind } from "@/types/order";
import { DetailGrid, RequirementDetails } from "./requirement-details";
import { ProjectInformation } from "./project-information";

const statusLabels: Record<MaterialRequestStatus, string> = {
  draft: "Draft", requested: "Requested", released: "Released",
  received: "Received", on_hold: "On Hold",
};

export function MaterialRequestRecordDetails({ record }: { record: MaterialRequestRecord }) {
  return <DetailGrid fields={[
    ["MI Number", record.miNumber], ["MI Status", statusLabels[record.status] ?? record.status],
    ["Requested By", record.requestedBy], ["Request Date", record.requestDate],
    ["Material", record.material], ["Quantity", record.quantity],
    ["Unit", record.unit], ["Remark", record.remark],
  ]} />;
}

export function MaterialRequestDetails({ order, allSources = false, fullProjectInformation = false }: { order: Order; allSources?: boolean; fullProjectInformation?: boolean }) {
  const source = order.materialRequestSource;
  const requirementKind = source ?? (order.workflow.productionOrder === "tooling" || order.workflow.productionOrder === "rubber"
    ? order.workflow.productionOrder : undefined);
  const requirementKinds: StandaloneRequirementKind[] = requirementKind ? [requirementKind] :
    order.workflow.preparationType === "offset" ? [] :
    order.workflow.productionOrder === "tooling_and_rubber" ? ["tooling", "rubber"] :
    order.toolingOrders.length || order.rubberOrders.length
      ? (["tooling", "rubber"] as const).filter((kind) => (kind === "tooling" ? order.toolingOrders : order.rubberOrders).length > 0)
      : ["tooling", "rubber"];
  const records = order.materialRequests.filter((record) => allSources || record.source === source);
  const latestRecords = allSources
    ? [undefined, "tooling", "rubber"].map((kind) => records.filter((record) => record.source === kind).at(-1)).filter((record): record is MaterialRequestRecord => Boolean(record))
    : records.slice(-1);

  return <>
    <ProjectInformation order={order} full={fullProjectInformation} />
    {requirementKinds.map((kind) => <RequirementDetails key={kind} order={order} kind={kind} showProject={false} showPrevious={false} />)}
    <section className="requirement-detail-section" aria-label="Material request input details">
      <h3>Material Request / MI Details - Latest Input</h3>
      {latestRecords.length ? latestRecords.map((record) => <div className="material-input-details" key={record.sequence}>
        {record.source ? <h3>{record.source === "tooling" ? "Tooling" : "Rubber"}</h3> : null}
        <MaterialRequestRecordDetails record={record} />
      </div>) :
        <div className="material-details-empty" role="status">
          <p>No material request details have been recorded.</p>
        </div>}
    </section>
  </>;
}
