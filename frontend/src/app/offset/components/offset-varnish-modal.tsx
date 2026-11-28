"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { canEditOffsetVarnish, offsetVarnishSnapshot, validateOffsetVarnishValues } from "@/lib/offset-preparation";
import { defaultOffsetPreparationStatus, isOffsetPreparationStatus, offsetPreparationStatusLabel, offsetPreparationStatusOptions } from "@/lib/offset-preparation-status";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useOffsetContinueConfirmation } from "./offset-continue-confirmation";
import type { OffsetPreparationSaveAction, OffsetVarnishValues, Order } from "@/types/order";

const valueOrDash = (value: string | undefined) => value?.trim() || "-";

/** The Varnish queue edits only its branch-owned monitoring values. */
export function OffsetVarnishModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const titleId = useId();
  const { orders, saveOffsetVarnish } = useWorkflowOrders();
  const [snapshot] = useState(() => offsetVarnishSnapshot(order));
  const savedStatus = order.offsetVarnish?.status ?? defaultOffsetPreparationStatus;
  const [status, setStatus] = useState<OffsetVarnishValues["status"]>(() => isOffsetPreparationStatus(savedStatus) ? savedStatus : "");
  const [remark, setRemark] = useState(order.offsetVarnish?.remark ?? "");
  const [validationError, setValidationError] = useState("");
  const currentOrder = orders.find((item) => item.id === order.id);
  const canEdit = Boolean(currentOrder && canEditOffsetVarnish(currentOrder));
  const draftError = validateOffsetVarnishValues({ status, remark }, "draft");
  const continueError = validateOffsetVarnishValues({ status, remark }, "continue");
  const actionError = validationError || (canEdit ? continueError : "");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const persist = (action: OffsetPreparationSaveAction) => {
    const error = action === "continue" ? continueError : draftError;
    if (error) { setValidationError(error); return; }
    const saveError = saveOffsetVarnish(order.id, { status, remark }, action, snapshot);
    if (saveError) { setValidationError(saveError); return; }
    onClose();
  };
  const { requestConfirmation, confirmation } = useOffsetContinueConfirmation(() => persist("continue"));

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit) return;
    const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "continue" ? "continue" : "draft";
    if (action === "continue" && !continueError) requestConfirmation();
    else persist(action);
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="modal-header"><div><h2 id={titleId}>Edit Block / Spot Varnish</h2><p>Update Varnish monitoring for {order.no}.</p></div><button type="button" className="modal-close" aria-label="Close Block / Spot Varnish form" onClick={onClose} autoFocus><Icon name="close" size={18} /></button></header>
      <form className="modal-form" onSubmit={save}>
        <div className="project-form-section-heading"><h3>Project Information</h3></div>
        <div className="modal-form-grid">
          <label className="modal-field"><span>Sample Number</span><input value={valueOrDash(order.no)} disabled /></label>
          <label className="modal-field"><span>MC No. / Code</span><input value={valueOrDash(order.mainData.mcNo)} disabled /></label>
          <label className="modal-field"><span>Customer</span><input value={valueOrDash(order.customer)} disabled /></label>
          <label className="modal-field"><span>Description / Component</span><input value={valueOrDash(order.mainData.component ?? order.product)} disabled /></label>
          <label className="modal-field"><span>PIC</span><input value={valueOrDash(order.pic)} disabled /></label>
          <label className="modal-field"><span>Target Completion Date</span><input value={valueOrDash(order.deadline)} disabled /></label>
        </div>
        <div className="modal-form-grid">
          <label className="modal-field"><span>Varnish Type</span><input value={valueOrDash(order.mainData.varnish)} disabled /></label>
          <label className="modal-field"><span>Lamination</span><input value={valueOrDash(order.mainData.lamination)} disabled /></label>
          <label className="modal-field"><span>Coating Side</span><input value={valueOrDash(order.mainData.coatingSide)} disabled /></label>
          <label className="modal-field"><span>Varnish Status <b className="project-form-required">*</b></span><select value={status} disabled={!canEdit} aria-invalid={Boolean(validationError) && !status} onChange={(event) => { if (isOffsetPreparationStatus(event.target.value)) setStatus(event.target.value); setValidationError(""); }}>{!status ? <option value="" disabled>{offsetPreparationStatusLabel(savedStatus)} — Select status</option> : null}{offsetPreparationStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="modal-field modal-field-full"><span>Remark</span><textarea value={remark} disabled={!canEdit} onChange={(event) => { setRemark(event.target.value); setValidationError(""); }} placeholder="Enter varnish monitoring notes" rows={3} /></label>
        </div>
        {actionError ? <p className="form-error" role={validationError ? "alert" : "status"}>{actionError}</p> : null}
        <footer className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="secondary" icon="save" value="draft" disabled={!canEdit || Boolean(draftError)}>Save Draft</Button>
          <Button type="submit" icon="arrow" value="continue" disabled={!canEdit || Boolean(continueError)}>Save &amp; Continue</Button>
        </footer>
      </form>
    {confirmation}
    </section>
  </div>;
}
