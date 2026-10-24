import type { Order, ProjectFormDraft } from "@/types/order";
import { getProjectFormConfig, getProjectFieldValue, isFieldVisible } from "@/app/orders/components/project-form-config";

/** Reuse the Offset input schema in read-only project details across workflow stages. */
export function OffsetProjectDetails({ order }: { order: Order }) {
  const draft: ProjectFormDraft = {
    mainData: order.mainData,
    entryType: order.lineage.entryType,
    previousProjectCode: order.lineage.sourceProjectNo ?? "",
    preparationType: order.workflow.preparationType,
    convertingRoute: order.workflow.convertingRoute ?? "",
    pic: order.pic === "-" ? "" : order.pic,
    projectDate: order.projectDate,
    deadline: order.deadline,
    drawingLink: order.workflow.drawingLink ?? "",
  };
  return <>{getProjectFormConfig(draft).map(section => <section
    key={section.id} className="requirement-detail-section project-form-section" aria-label={section.title}>
    <h3>{section.title}</h3>
    <dl className="incoming-detail-grid">
      {section.id === "process-route" ? <div><dt>PSR / Code</dt><dd>{order.no}</dd></div> : null}
      {section.fields.filter(field => isFieldVisible(field, draft)).map(field => {
        const value = getProjectFieldValue(draft, field);
        const display = value.trim() ? field.options?.find(option => option.value === value)?.label ?? value : "-";
        return <div key={field.key} className={field.fullWidth ? "incoming-detail-full" : undefined}>
          <dt>{field.label}</dt>
          <dd>{field.key === "drawingLink" && order.workflow.drawingLink
            ? <a className="drawing-link" href={order.workflow.drawingLink} target="_blank" rel="noopener noreferrer">{order.workflow.drawingFileName ?? "Open Drawing"}</a>
            : display}</dd>
        </div>;
      })}
    </dl>
  </section>)}</>;
}
