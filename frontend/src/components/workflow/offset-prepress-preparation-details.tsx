"use client";

import { useState } from "react";
import { OffsetToolingDraftModal } from "@/app/offset/components/offset-tooling-management-modals";
import { useOptionalWorkflowOrders } from "./workflow-provider";
import { Icon } from "@/components/ui/icon";
import type { OffsetPreparationPlanValues, OffsetToolingValues, Order } from "@/types/order";

type PreparationOrder = "tooling" | "varnish";
type PreparationOrderRow = PreparationOrder | null;

/** The Offset plan belongs in Details and remains draft-only until Update. */
export function OffsetPrepressPreparationDetails({ order, onClose, onSubmitted }: { order: Order; onClose: () => void; onSubmitted?: () => void }) {
  const workflow = useOptionalWorkflowOrders();
  const currentOrder = workflow?.orders.find((item) => item.id === order.id) ?? order;
  const savedPlan = currentOrder.offsetPreparationPlan?.projectId === currentOrder.id ? currentOrder.offsetPreparationPlan : undefined;
  const initialOrders: PreparationOrderRow[] = [];
  if (savedPlan?.tooling) initialOrders.push("tooling");
  if (savedPlan?.varnish) initialOrders.push("varnish");
  const [materialRequested, setMaterialRequested] = useState(Boolean(savedPlan?.material));
  const [preparationOrders, setPreparationOrders] = useState<PreparationOrderRow[]>(initialOrders);
  const [toolingDraft, setToolingDraft] = useState<OffsetToolingValues | undefined>(savedPlan?.tooling?.draft);
  const [remark, setRemark] = useState(savedPlan?.remark ?? "");
  const [isToolingEditorOpen, setIsToolingEditorOpen] = useState(false);
  const toolingSubmitted = savedPlan?.tooling?.state === "submitted";
  const varnishSubmitted = savedPlan?.varnish?.state === "submitted";
  const canUpdatePreparation = currentOrder.stage === "offset-prepress";
  const preparationOrderLocked = !materialRequested;
  const selectedOrders = preparationOrders.filter((kind): kind is PreparationOrder => Boolean(kind));
  const canAddPreparationOrder = preparationOrders.length < 2;
  const hasUnselectedPreparationOrder = preparationOrders.some((kind) => !kind);

  const planValues = (materialState: "draft" | "submitted", rows = preparationOrders, draft = toolingDraft): OffsetPreparationPlanValues => {
    const selected = rows.filter((kind): kind is PreparationOrder => Boolean(kind));
    const includesTooling = selected.includes("tooling");
    return {
      material: { state: materialState },
      ...(includesTooling && (draft ?? savedPlan?.tooling?.draft) ? {
        tooling: {
          state: materialState === "submitted" ? "submitted" as const : "draft" as const,
          draft: draft ?? savedPlan?.tooling?.draft,
        },
      } : {}),
      // Varnish remains draft-only until its separate integration is approved.
      ...(selected.includes("varnish") ? { varnish: { state: varnishSubmitted ? "submitted" as const : "draft" as const } } : {}),
      remark,
    };
  };

  const persistToolingDraft = (draft: OffsetToolingValues) => {
    if (!workflow) return;
    setToolingDraft(draft);
    workflow.saveOffsetPreparationPlan(currentOrder.id, planValues(savedPlan?.material.state === "submitted" ? "submitted" : "draft", preparationOrders, draft));
    setIsToolingEditorOpen(false);
  };
  const updatePreparationOrder = (index: number, value: PreparationOrderRow) => {
    setPreparationOrders((current) => current.map((kind, rowIndex) => rowIndex === index ? value : kind));
  };
  const removePreparationOrder = (index: number) => {
    const kind = preparationOrders[index];
    if (!workflow || (kind === "tooling" && toolingSubmitted) || (kind === "varnish" && varnishSubmitted)) return;
    const nextOrders = preparationOrders.filter((_, rowIndex) => rowIndex !== index);
    const nextDraft = kind === "tooling" ? undefined : toolingDraft;
    setPreparationOrders(nextOrders);
    setToolingDraft(nextDraft);
    workflow.saveOffsetPreparationPlan(currentOrder.id, planValues(savedPlan?.material.state === "submitted" ? "submitted" : "draft", nextOrders, nextDraft));
  };
  const updatePreparation = () => {
    if (!workflow || !materialRequested || !canUpdatePreparation) return;
    workflow.submitOffsetMaterialPreparation(currentOrder.id, planValues("submitted"));
    onSubmitted?.();
  };
  return <>
    <section className="project-form-section">
      <div className="project-form-section-heading"><h3>Status &amp; Preparation</h3></div>
      <div className="modal-form-grid">
        <label className="modal-field material-request-field">
          <span>Next Preparation</span>
          <select className="preparation-select" value={materialRequested ? "material" : ""} disabled={!canUpdatePreparation} onChange={(event) => setMaterialRequested(event.target.value === "material")}>
            <option value="">Select next step...</option><option value="material">Request Material / Create MI</option>
          </select>
        </label>
        {canAddPreparationOrder && !hasUnselectedPreparationOrder ? <div className="modal-field">
          <span>Preparation Order</span>
          <button type="button" className="preparation-add-button" disabled={!workflow || preparationOrderLocked || !canUpdatePreparation} title={preparationOrderLocked ? "Select Next Preparation first" : !canUpdatePreparation ? "Preparation has already been submitted." : undefined} onClick={() => setPreparationOrders((current) => [...current, null])}><Icon name="plus" size={14} /> Add Preparation Order</button>
        </div> : null}
        {preparationOrders.length ? <div className="modal-field modal-field-full">
          <span>Preparation Order</span>
          <div className="preparation-order-list is-compact">
            {preparationOrders.map((kind, index) => <div className="preparation-order-controls" key={`${kind ?? "empty"}-${index}`}>
              <select className="preparation-select" value={kind ?? ""} aria-label={`Preparation order ${index + 1} for ${currentOrder.no}`} disabled={!canUpdatePreparation || toolingSubmitted && kind === "tooling" || (kind === "tooling" && Boolean(toolingDraft))} onChange={(event) => updatePreparationOrder(index, (event.target.value as PreparationOrder) || null)}>
                <option value="">Select preparation order...</option>
                <option value="tooling" disabled={selectedOrders.includes("tooling") && kind !== "tooling"}>Tooling / Plate</option>
                <option value="varnish" disabled={selectedOrders.includes("varnish") && kind !== "varnish"}>Block / Spot Varnish</option>
              </select>
              {kind === "tooling" && !toolingSubmitted ? <button type="button" className="table-action" disabled={!workflow || !canUpdatePreparation} aria-label={`Edit Tooling / Plate draft for ${currentOrder.no}`} title={toolingDraft ? "Edit Tooling / Plate draft" : "Add Tooling / Plate detail"} onClick={() => setIsToolingEditorOpen(true)}><Icon name="pen" size={15} /></button> : null}
              {!((kind === "tooling" && toolingSubmitted) || (kind === "varnish" && varnishSubmitted)) ? <button type="button" className="table-action preparation-row-remove" disabled={!workflow || !canUpdatePreparation} aria-label={`Remove ${kind === "tooling" ? "Tooling / Plate" : kind === "varnish" ? "Block / Spot Varnish" : "preparation order"} draft for ${currentOrder.no}`} title="Remove preparation order" onClick={() => removePreparationOrder(index)}><Icon name="close" size={14} /></button> : null}
            </div>)}
          </div>
        </div> : null}
        <label className="modal-field"><span>Remarks</span><input className="preparation-remark" value={remark} disabled={!canUpdatePreparation} aria-label={`Write preparation remarks for ${currentOrder.no}`} placeholder="Write a remark..." onChange={(event) => setRemark(event.target.value)} /></label>
      </div>
      <div className="incoming-detail-actions">
        <button type="button" className="table-update-button" disabled={!workflow || !materialRequested || !canUpdatePreparation} title={!materialRequested ? "Select Request Material / Create MI first" : !canUpdatePreparation ? "Preparation has already been submitted." : "Save the preparation plan without moving the workflow"} onClick={updatePreparation}><Icon name="save" size={14} /> Update</button>
        <button type="button" className="table-cancel-button" onClick={onClose}><Icon name="close" size={14} /> Cancel</button>
      </div>
    </section>
    <section className="requirement-detail-section" aria-label="Varnish Specification">
      <h3>Varnish Specification</h3><dl className="incoming-detail-grid"><div><dt>Varnish Type</dt><dd>{currentOrder.mainData.varnish || "-"}</dd></div><div><dt>Lamination</dt><dd>{currentOrder.mainData.lamination || "-"}</dd></div><div><dt>Coating Side</dt><dd>{currentOrder.mainData.coatingSide || "-"}</dd></div></dl>
    </section>
    {isToolingEditorOpen && workflow ? <OffsetToolingDraftModal order={currentOrder} draftValues={toolingDraft} onSaveDraft={persistToolingDraft} onClose={() => setIsToolingEditorOpen(false)} /> : null}
  </>;
}
