"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWorkflowOrders, validateOffsetPrepressValues } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { OffsetPlateType, OffsetPrepressStatus, OffsetPrepressValues, Order } from "@/types/order";

const plateTypes: readonly OffsetPlateType[] = ["", "GTO54", "CD102", "SM102", "SUMITOMO"];
const prepressStatuses: readonly Exclude<OffsetPrepressStatus, "">[] = ["Ready", "Waiting"];

function savedStatus(value: string | undefined): OffsetPrepressStatus {
  return value === "Ready" || value === "Waiting" ? value : "";
}

export function OffsetPrepressModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const titleId = useId();
  const { saveOffsetPrepress } = useWorkflowOrders();
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

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const update = <Key extends keyof OffsetPrepressValues>(key: Key, value: OffsetPrepressValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = validateOffsetPrepressValues(values);
    if (error) {
      setValidationError(error);
      return;
    }
    saveOffsetPrepress(order.id, values, false);
    onClose();
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
          <label className="modal-field"><span>ID Plate</span><input value={values.idPlate} onChange={(event) => update("idPlate", event.target.value)} /></label>
          <label className="modal-field"><span>Plate Type</span><select value={values.plateType} onChange={(event) => update("plateType", event.target.value as OffsetPlateType)}>{plateTypes.map((type) => <option key={type || "empty"} value={type}>{type || "Select plate type..."}</option>)}</select></label>
          <label className="modal-field"><span>FG Qty</span><input type="number" min="0" value={values.fgQuantity} placeholder="Enter FG Qty" onChange={(event) => update("fgQuantity", event.target.value)} /></label>
          <label className="modal-field"><span>Colours</span><input value={order.mainData.colours || "-"} disabled /></label>
          <label className="modal-field"><span>Coating / Varnish</span><input value={order.mainData.varnish || "-"} disabled /></label>
        </div>
        <div className="project-form-section-heading prepress-status-section-heading"><h3>Prepress Status</h3></div>
        <div className="modal-form-grid">
          {(["proofColor", "plot", "plate", "ink"] as const).map((field) => <label className="modal-field" key={field}><span>{({ proofColor: "Proof Color", plot: "Plot", plate: "Plate", ink: "Ink" }[field])} <b className="project-form-required">*</b></span><select value={values[field]} aria-invalid={Boolean(validationError) && !values[field]} onChange={(event) => { update(field, event.target.value as OffsetPrepressStatus); setValidationError(""); }}><option value="">Select status...</option>{prepressStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>)}
          <label className="modal-field modal-field-full"><span>Remark</span><textarea value={values.remark} aria-invalid={Boolean(validationError) && (values.proofColor === "Waiting" || values.plot === "Waiting" || values.plate === "Waiting" || values.ink === "Waiting")} placeholder="Enter prepress notes or explain any preparation issues..." rows={3} onChange={(event) => { update("remark", event.target.value); setValidationError(""); }} /></label>
        </div>
        {validationError ? <p className="project-save-error" role="alert">{validationError}</p> : null}
        <footer className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="secondary">Save Prepress</Button>
        </footer>
      </form>
    </section>
  </div>;
}
