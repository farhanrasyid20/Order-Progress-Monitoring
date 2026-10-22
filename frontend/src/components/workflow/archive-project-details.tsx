import type { ReactNode } from "react";
import type { Order, ProjectFormDraft } from "@/types/order";
import { projectFormConfig, getProjectFieldValue, isFieldVisible } from "@/app/orders/components/project-form-config";
import { DetailGrid, RequirementDetails } from "./requirement-details";

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
export function ArchiveProjectDetails({ order }: { order: Order }) {
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

  return <div className="archive-stage-details">
    <Section title="Incoming Design">
      <DetailGrid fields={[
        ["PSR / Code", order.no], ["Root Project", order.lineage.rootProjectNo],
        ["Version", String(order.lineage.versionNumber)], ["Created At", order.createdAt],
        ["Description", order.description], ["Material", order.material], ["Priority", order.priority],
      ]} />
      {projectFormConfig.map((section) => <section key={section.id} className="project-form-section">
        <h3>{section.title}</h3>
        <DetailGrid fields={section.fields.filter((field) => isFieldVisible(field, draft) && field.key !== "drawingLink").map((field) => {
          const value = getProjectFieldValue(draft, field);
          return [field.label, field.options?.find((option) => option.value === value)?.label ?? value];
        })} />
      </section>)}
    </Section>
    <Section title="Drawing & Preparation">
      <DetailGrid fields={[
        ["Drawing Status", order.workflow.drawingStatus], ["Design Decision", order.workflow.designDecision],
        ["Preparation Type", order.workflow.preparationType], ["Converting Route", order.workflow.convertingRoute],
        ["Production Order", order.workflow.productionOrder], ["Material Requested", order.workflow.materialRequested ? "Yes" : "No"],
        ["Drawing File", order.workflow.drawingFileName],
      ]} />
      {order.workflow.drawingLink ? <a className="drawing-link" href={order.workflow.drawingLink} target="_blank" rel="noopener noreferrer">Open Drawing</a> : <p>No drawing recorded.</p>}
    </Section>
    <RequirementDetails order={order} kind="tooling" showProject={false} />
    <RequirementDetails order={order} kind="rubber" showProject={false} />
    <Section title="Material Request / MI - All Inputs">
      <Records records={order.materialRequests} labels={{ miNumber: "MI Number", source: "Request Source", requestedBy: "Requested By", requestDate: "Request Date" }} />
    </Section>
    <Section title="Offset Preparation / SPK - All Inputs">
      <Records records={order.offsetSpks} labels={{ id: "SPK ID", fgQuantity: "FG Quantity", up: "UP", planoSheets: "Plano Sheets" }} />
    </Section>
    <Section title="Sample Process - All Inputs">
      <Records records={order.sampleProgress ?? []} labels={{ pic: "Sample PIC", deadline: "Target Completion Date", sampleNumber: "Sample Number", notes: "Production Notes" }} />
    </Section>
    <Section title="Submit Sample - All Submissions">
      <Records records={order.sampleSubmissions ?? []} labels={{ submittedDate: "Submission Date", recordedAt: "Recorded At" }} />
    </Section>
    <Section title="Closing - QC, FA Report & Sample Decision">
      <Records records={closingHistory} labels={{ process: "Activity", status: "Status / Decision", date: "Time", user: "Updated By", changeSummary: "Changes", remark: "Reference / Notes" }} />
    </Section>
  </div>;
}
