"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { OffsetPlateType, OffsetPrepressValues, Order } from "@/types/order";

const plateTypes: readonly OffsetPlateType[] = ["", "GTO54", "CD102", "SM102", "SUMITOMO"];

export function OffsetPrepressModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const titleId = useId();
  const saveMode = useRef<"save" | "continue">("save");
  const { saveOffsetPrepress } = useWorkflowOrders();
  const saved = order.offsetPrepress;
  const [values, setValues] = useState<OffsetPrepressValues>({
    noJoPnCode: saved?.noJoPnCode ?? "",
    idPlate: saved?.idPlate ?? "",
    plateType: saved?.plateType ?? "",
    proofColor: saved?.proofColor ?? "",
    plot: saved?.plot ?? "",
    plate: saved?.plate ?? "",
    ink: saved?.ink ?? "",
    remark: saved?.remark ?? "",
  });

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
    saveOffsetPrepress(order.id, values, saveMode.current === "continue");
    onClose();
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="modal-header">
        <div>
          <h2 id={titleId}>Prepress</h2>
          <p>Record Offset prepress readiness before continuing to Material / MI.</p>
        </div>
        <button type="button" className="modal-close" aria-label="Close Prepress form" onClick={onClose} autoFocus>
          <Icon name="close" size={18} />
        </button>
      </header>

      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="modal-form-grid">
          <label className="modal-field"><span>Sample Number</span><input value={order.no} disabled /></label>
          <label className="modal-field"><span>No JO / PN / Code</span><input value={values.noJoPnCode} onChange={(event) => update("noJoPnCode", event.target.value)} /></label>
          <label className="modal-field"><span>ID Plate</span><input value={values.idPlate} onChange={(event) => update("idPlate", event.target.value)} /></label>
          <label className="modal-field"><span>Plate Type</span><select value={values.plateType} onChange={(event) => update("plateType", event.target.value as OffsetPlateType)}>{plateTypes.map((type) => <option key={type || "empty"} value={type}>{type || "Select plate type..."}</option>)}</select></label>
          <label className="modal-field"><span>Proof Color</span><input value={values.proofColor} placeholder="Ready, waiting, or notes" onChange={(event) => update("proofColor", event.target.value)} /></label>
          <label className="modal-field"><span>Plot</span><input value={values.plot} placeholder="Ready, waiting, or notes" onChange={(event) => update("plot", event.target.value)} /></label>
          <label className="modal-field"><span>Plate</span><input value={values.plate} placeholder="Ready, waiting, or notes" onChange={(event) => update("plate", event.target.value)} /></label>
          <label className="modal-field"><span>Ink</span><input value={values.ink} placeholder="Ready, waiting, or notes" onChange={(event) => update("ink", event.target.value)} /></label>
          <label className="modal-field modal-field-full"><span>Remark</span><textarea value={values.remark} placeholder="Prepress notes or handoff remark" rows={3} onChange={(event) => update("remark", event.target.value)} /></label>
        </div>
        <footer className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="secondary" onClick={() => { saveMode.current = "save"; }}>Save Prepress</Button>
          <Button type="submit" icon="arrow" onClick={() => { saveMode.current = "continue"; }}>Save &amp; Continue to Material / MI</Button>
        </footer>
      </form>
    </section>
  </div>;
}
