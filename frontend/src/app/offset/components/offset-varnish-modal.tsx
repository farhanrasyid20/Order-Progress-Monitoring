"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWorkflowOrders, validateOffsetVarnishValues } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { OffsetVarnishStatus, Order } from "@/types/order";

const statuses: readonly OffsetVarnishStatus[] = ["Waiting", "In Progress", "Ready", "Revision Required"];
const valueOrDash = (value: string | undefined) => value?.trim() || "-";

/** The Varnish queue edits only its branch-owned monitoring values. */
export function OffsetVarnishModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const titleId = useId();
  const { saveOffsetVarnish } = useWorkflowOrders();
  const [status, setStatus] = useState<OffsetVarnishStatus | "">(order.offsetVarnish?.status ?? "Waiting");
  const [remark, setRemark] = useState(order.offsetVarnish?.remark ?? "");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = validateOffsetVarnishValues({ status, remark });
    if (error) { setValidationError(error); return; }
    saveOffsetVarnish(order.id, { status, remark });
    onClose();
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
        </div>
        <div className="modal-form-grid">
          <label className="modal-field"><span>Varnish Status <b className="project-form-required">*</b></span><select value={status} aria-invalid={Boolean(validationError) && !status} onChange={(event) => { setStatus(event.target.value as OffsetVarnishStatus); setValidationError(""); }}><option value="">Select status...</option>{statuses.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
          <label className="modal-field modal-field-full"><span>Remark{status === "Revision Required" ? <b className="project-form-required"> *</b> : null}</span><textarea value={remark} aria-invalid={Boolean(validationError) && status === "Revision Required" && !remark.trim()} onChange={(event) => { setRemark(event.target.value); setValidationError(""); }} placeholder="Enter varnish monitoring notes" rows={3} /></label>
        </div>
        {validationError ? <p className="form-error" role="alert">{validationError}</p> : null}
        <footer className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" icon="save">Save Varnish</Button></footer>
      </form>
    </section>
  </div>;
}
