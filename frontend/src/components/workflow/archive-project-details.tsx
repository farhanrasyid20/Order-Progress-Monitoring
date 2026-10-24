import type { ReactNode } from "react";
import type { Order, ProjectFormDraft } from "@/types/order";
import { getProjectFormConfig, getProjectFieldValue, isFieldVisible } from "@/app/orders/components/project-form-config";
import { DetailGrid, RequirementDetails } from "./requirement-details";
import { ProjectInformation } from "./project-information";
import { MaterialRequestDetails, MaterialRequestRecordDetails } from "./material-request-details";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="requirement-detail-section" aria-label={title}>
    <h3>{title}</h3>{children}
  </section>;
}

function Records({ records, labels }: { records: object[]; labels: Record<string, string> }) {
  if (!records.length) return <p>No records available for this stage.</p>;
  return <>{records.map((record, index) => <details className="requirement-detail-version" key={index} open={index === records.length - 1}>
    <summary>Record #{index + 1}</summary>
    <DetailGrid fields={Object.entries(record).map(([key, value]) => [
      labels[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()),
      value == null ? "-" : String(value),
    ])} />
  </details>)}</>;
}

/** Read-only archive of all retained project inputs, including earlier versions. */
export function ArchiveProjectDetails({ order, offsetOnly = false }: { order: Order; offsetOnly?: boolean }) {
  if (offsetOnly && order.stage === "offset-material-request") {
    return <div className="archive-stage-details"><MaterialRequestDetails order={order} /></div>;
  }
  const draft: ProjectFormDraft = {
    mainData: order.mainData,
    entryType: order.lineage.entryType,
    previousProjectCode: order.lineage.sourceProjectNo ?? "",
    preparationType: order.workflow.preparationType,
    convertingRoute: order.workflow.convertingRoute ?? "",
    pic: order.pic,
    projectDate: order.projectDate,
    deadline: order.deadline,
    drawingLink: order.workflow.drawingLink ?? "",
  };
  const closingHistory = order.processHistory.filter((record) =>
    ["handoff_details_updated", "sample_submitted", "sample_decision"].includes(record.process),
  );
  const hidePreparationInputs = offsetOnly && order.stage === "offset-prepress";
  const showVarnishInput = offsetOnly && order.stage === "offset-press";
  const showPlateInput = offsetOnly && (order.stage === "offset-varnish" || showVarnishInput);
  const latestMaterialOnly = offsetOnly && (order.stage === "offset-plate" || showPlateInput);
  const latestMaterial = order.materialRequests.at(-1);
  const latestPlate = order.processHistory.filter((record, index, history) =>
    record.process === "handoff_details_updated" &&
    (record.stage === "offset-plate" || (!record.stage && history[index + 1]?.process === "Block / Spot Varnish")),
  ).at(-1);
  const latestVarnish = order.processHistory.filter((record, index, history) =>
    record.process === "handoff_details_updated" &&
    (record.stage === "offset-varnish" || (!record.stage && ["Press / Cetak", "Press / Printing"].includes(history[index + 1]?.process))),
  ).at(-1);

  return <div className="archive-stage-details">
    {offsetOnly ? <ProjectInformation order={order} /> : null}
    {!offsetOnly ? <Section title="Incoming Design">
      <DetailGrid fields={[
        ["PSR / Code", order.no], ["Root Project", order.lineage.rootProjectNo],
        ["Version", String(order.lineage.versionNumber)], ["Created At", order.createdAt],
        ["Description", order.description], ["Material", order.material], ["Priority", order.priority],
      ]} />
      {getProjectFormConfig(draft).map((section) => <section key={section.id} className="project-form-section">
        <h3>{section.title}</h3>
        <DetailGrid fields={section.fields.filter((field) => isFieldVisible(field, draft) && field.key !== "drawingLink").map((field) => {
          const value = getProjectFieldValue(draft, field);
          return [field.label, value.trim() ? field.options?.find((option) => option.value === value)?.label ?? value : "-"];
        })} />
      </section>)}
    </Section> : null}
    {!offsetOnly ? <Section title="Drawing & Preparation">
      <DetailGrid fields={[
        ["Drawing Status", order.workflow.drawingStatus], ["Design Decision", order.workflow.designDecision],
        ["Preparation Type", order.workflow.preparationType], ...(order.workflow.preparationType === "offset" ? [] : [["Converting Route", order.workflow.convertingRoute] as [string, string | null | undefined]]),
        ["Production Order", order.workflow.productionOrder], ["Material Requested", order.workflow.materialRequested ? "Yes" : "No"],
        ["Drawing File", order.workflow.drawingFileName],
      ]} />
      {order.workflow.drawingLink ? <a className="drawing-link" href={order.workflow.drawingLink} target="_blank" rel="noopener noreferrer">Open Drawing</a> : <p>No drawing recorded.</p>}
    </Section> : null}
    {!offsetOnly && order.requirementBranch !== "rubber" ? <RequirementDetails order={order} kind="tooling" showProject={false} /> : null}
    {!offsetOnly && order.requirementBranch !== "tooling" ? <RequirementDetails order={order} kind="rubber" showProject={false} /> : null}
    {!hidePreparationInputs ? <Section title={latestMaterialOnly ? "Material Request / MI Details - Latest Input" : "Material Request / MI - All Inputs"}>
      {latestMaterialOnly ? latestMaterial
        ? <MaterialRequestRecordDetails record={latestMaterial} />
        : <p>No material request details have been recorded.</p>
        : <Records records={order.materialRequests} labels={{ miNumber: "MI Number", source: "Request Source", requestedBy: "Requested By", requestDate: "Request Date" }} />}
    </Section> : null}
    {showPlateInput ? <Section title="Tooling / Plate Details - Latest Input">
      {latestPlate ? <DetailGrid fields={[
        ["PIC", latestPlate.pic], ["Target Completion Date", latestPlate.deadline],
        ["Notes", latestPlate.remark], ["Recorded At", latestPlate.date], ["Updated By", latestPlate.user],
      ]} /> : <p>No tooling / plate details have been recorded.</p>}
    </Section> : null}
    {showVarnishInput ? <Section title="Block / Spot Varnish Details - Latest Input">
      {latestVarnish ? <DetailGrid fields={[
        ["PIC", latestVarnish.pic], ["Target Completion Date", latestVarnish.deadline],
        ["Notes", latestVarnish.remark], ["Recorded At", latestVarnish.date], ["Updated By", latestVarnish.user],
      ]} /> : <p>No block / spot varnish details have been recorded.</p>}
    </Section> : null}
    {!hidePreparationInputs && !latestMaterialOnly ? <Section title="Offset Preparation / SPK - All Inputs">
      <Records records={order.offsetSpks} labels={{ id: "SPK ID", fgQuantity: "FG Quantity", up: "UP", planoSheets: "Plano Sheets", productName: "Product / Component", paperType: "Paper Type", grammage: "Grammage", planoSize: "Plano Size", colors: "Colors", machine: "Machine", finishing: "Finishing", waste: "Waste", remark: "Remarks", createdAt: "Created At" }} />
    </Section> : null}
    {!offsetOnly ? <Section title="Sample Process - All Inputs">
      <Records records={order.sampleProgress ?? []} labels={{ pic: "Sample PIC", deadline: "Target Completion Date", sampleNumber: "Sample Number", notes: "Production Notes" }} />
    </Section> : null}
    {!offsetOnly ? <Section title="Submit Sample - All Submissions">
      <Records records={order.sampleSubmissions ?? []} labels={{ submittedDate: "Submission Date", recordedAt: "Recorded At" }} />
    </Section> : null}
    {!offsetOnly ? <Section title="Closing - QC, FA Report & Sample Decision">
      <Records records={closingHistory} labels={{ process: "Activity", status: "Status / Decision", date: "Time", user: "Updated By", changeSummary: "Changes", remark: "Reference / Notes" }} />
    </Section> : null}
  </div>;
}
