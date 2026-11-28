"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { canEditOffsetPreparation, offsetPreparationSnapshot, validateOffsetPrepressValues } from "@/lib/offset-readiness";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useOffsetContinueConfirmation } from "./offset-continue-confirmation";
import type { OffsetPlateType, OffsetPreparationSaveAction, OffsetPrepressStatus, OffsetPrepressValues, Order } from "@/types/order";

const plateTypes: readonly OffsetPlateType[] = ["", "GTO54", "CD102", "SM102", "SUMITOMO"];
const prepressStatuses: readonly Exclude<OffsetPrepressStatus, "">[] = ["Ready", "Waiting"];

function savedStatus(value: string | undefined): OffsetPrepressStatus {
  return value === "Ready" || value === "Waiting" ? value : "";
}

export function OffsetPrepressModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const titleId = useId();
  const { orders, saveOffsetPrepress } = useWorkflowOrders();
  const [snapshot] = useState(() => offsetPreparationSnapshot(order, "prepress"));
  const currentOrder = orders.find((item) => item.id === order.id);
  const canEdit = Boolean(currentOrder && canEditOffsetPreparation(currentOrder, "prepress"));
  const saved = order.offsetPrepress;
  const noJoPnCode = order.mainData.mcNo || saved?.noJoPnCode || "";
  const [values, setValues] = useState<OffsetPrepressValues>({
    noJoPnCode,
    idPlate: saved?.idPlate ?? "",
    plateType: saved?.plateType ?? "",
    fgQuantity: saved?.fgQuantity ?? "",
    proofColor: savedStatus(saved?.proofColor),
    plot: savedStatus(saved?.plot),
    plate: savedStatus(saved?.plate),
    ink: savedStatus(saved?.ink),
    remark: saved?.remark ?? "",
  });
  const [validationError, setValidationError] = useState("");
  const draftError = validateOffsetPrepressValues(values, "draft");
  const continueError = validateOffsetPrepressValues(values, "continue");
  const actionError = validationError || (canEdit ? continueError : "");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const update = <Key extends keyof OffsetPrepressValues>(key: Key, value: OffsetPrepressValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setValidationError("");
  };

  const persist = (action: OffsetPreparationSaveAction) => {
    const error = (action === "continue" ? continueError : draftError) || saveOffsetPrepress(order.id, values, action, snapshot);
    if (error) {
      setValidationError(error);
      return;
    }
    onClose();
  };
  const { requestConfirmation, confirmation } = useOffsetContinueConfirmation(() => persist("continue"));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canEdit) return;
    const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "continue" ? "continue" : "draft";
    if (action === "continue" && !continueError) requestConfirmation();
    else persist(action);
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="modal-dialog modal-dialog-wide" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="modal-header">
        <div>
          <h2 id={titleId}>Edit Prepress</h2>
          <p>Record Offset prepress information and preparation readiness.</p>
        </div>
        <button type="button" className="modal-close" aria-label="Close Prepress form" onClick={onClose} autoFocus>
          <Icon name="close" size={18} />
        </button>
      </header>

      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="project-form-section-heading"><h3>Project Information</h3></div>
        <div className="modal-form-grid">
          <label className="modal-field"><span>Sample Number</span><input value={order.no} disabled /></label>
          <label className="modal-field"><span>MC No. / Code</span><input value={noJoPnCode || "-"} disabled /></label>
          <label className="modal-field"><span>Customer</span><input value={order.mainData.custName || order.customer} disabled /></label>
          <label className="modal-field"><span>Description / Component</span><input value={order.mainData.component || order.product} disabled /></label>
          <label className="modal-field"><span>Material</span><input value={order.mainData.boardQua || order.material} disabled /></label>
          <label className="modal-field"><span>FG Qty (SHT)</span><input value={order.mainData.fgQuantity || "-"} disabled /></label>
          <label className="modal-field"><span>Imposition / Up</span><input value={order.mainData.imposition || "-"} disabled /></label>
          <label className="modal-field"><span>ID Plate</span><input value={values.idPlate} disabled={!canEdit} onChange={(event) => update("idPlate", event.target.value)} /></label>
          <label className="modal-field"><span>Plate Type</span><select value={values.plateType} disabled={!canEdit} onChange={(event) => update("plateType", event.target.value as OffsetPlateType)}>{plateTypes.map((type) => <option key={type || "empty"} value={type}>{type || "Select plate type..."}</option>)}</select></label>
          <label className="modal-field"><span>FG Qty</span><input type="number" min="0" value={values.fgQuantity} disabled={!canEdit} placeholder="Enter FG Qty" onChange={(event) => update("fgQuantity", event.target.value)} /></label>
          <label className="modal-field"><span>Colours</span><input value={order.mainData.colours || "-"} disabled /></label>
          <label className="modal-field"><span>Coating / Varnish</span><input value={order.mainData.varnish || "-"} disabled /></label>
        </div>
        <div className="project-form-section-heading prepress-status-section-heading"><h3>Prepress Status</h3></div>
        <div className="modal-form-grid">
          {(["proofColor", "plot", "plate", "ink"] as const).map((field) => <label className="modal-field" key={field}><span>{({ proofColor: "Proof Color", plot: "Plot", plate: "Plate", ink: "Ink" }[field])} <b className="project-form-required">*</b></span><select value={values[field]} disabled={!canEdit} aria-invalid={Boolean(validationError) && !values[field]} onChange={(event) => { update(field, event.target.value as OffsetPrepressStatus); setValidationError(""); }}><option value="">Select status...</option>{prepressStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>)}
          <label className="modal-field modal-field-full"><span>Remark</span><textarea value={values.remark} disabled={!canEdit} aria-invalid={Boolean(validationError) && (values.proofColor === "Waiting" || values.plot === "Waiting" || values.plate === "Waiting" || values.ink === "Waiting")} placeholder="Enter prepress notes or explain any preparation issues..." rows={3} onChange={(event) => { update("remark", event.target.value); setValidationError(""); }} /></label>
        </div>
        {actionError ? <p className="project-save-error" role={validationError ? "alert" : "status"}>{actionError}</p> : null}
        <footer className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" value="draft" variant="secondary" disabled={!canEdit || Boolean(draftError)}>Save Draft</Button>
          <Button type="submit" value="continue" icon="arrow" disabled={!canEdit || Boolean(continueError)}>Save &amp; Continue</Button>
        </footer>
      </form>
      {confirmation}
    </section>
  </div>;
}
