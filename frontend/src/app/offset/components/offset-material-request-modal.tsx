"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { canContinueOffsetPreparation, canEditOffsetPreparation, offsetMaterialName, offsetPreparationSnapshot, validateOffsetMaterialValues } from "@/lib/offset-readiness";
import { useOffsetContinueConfirmation } from "./offset-continue-confirmation";
import type { MaterialRequestStatus, OffsetPreparationSaveAction, Order } from "@/types/order";

const statuses: readonly { value: MaterialRequestStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "requested", label: "Requested" },
  { value: "released", label: "Released" },
  { value: "received", label: "Received" },
  { value: "on_hold", label: "On Hold" },
];

/** Offset-only MI form. It follows the existing Material Request modal layout without any downstream routing control. */
export function OffsetMaterialRequestModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const titleId = useId();
  const { orders, saveOffsetMaterial } = useWorkflowOrders();
  const [snapshot] = useState(() => offsetPreparationSnapshot(order, "material"));
  const currentOrder = orders.find((item) => item.id === order.id) ?? order;
  const latest = order.materialRequests.at(-1);
  const canEdit = canEditOffsetPreparation(currentOrder, "material");
  const [saveError, setSaveError] = useState("");
  const [miNumber] = useState(latest?.miNumber ?? `OMI-${currentOrder.no.replace("#", "-")}-1`);
  const [status, setStatus] = useState<MaterialRequestStatus>(latest?.status ?? "draft");
  const [requestDate, setRequestDate] = useState(latest?.requestDate ?? "");
  const masterMaterial = offsetMaterialName(order);
  const [quantity, setQuantity] = useState(latest?.quantity ?? "");
  const [unit, setUnit] = useState(latest?.unit ?? "sheet");
  const [remark, setRemark] = useState(latest?.remark ?? "");
  const values = {
    miNumber, status, requestDate, quantity, unit, remark,
    requestedBy: latest?.requestedBy ?? (order.pic === "-" ? "" : order.pic),
    material: masterMaterial,
  };
  const draftError = validateOffsetMaterialValues(values, "draft");
  const continueError = validateOffsetMaterialValues(values, "continue") ||
    (canContinueOffsetPreparation(currentOrder, "material") ? "" : "Material / MI has no submitted preparation branch.");
  const actionError = saveError || (canEdit ? continueError : "");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const persist = (action: OffsetPreparationSaveAction) => {
    const error = (action === "continue" ? continueError : draftError) || saveOffsetMaterial(order.id, values, action, snapshot);
    if (error) { setSaveError(error); return; }
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

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="modal-header">
        <div><h2 id={titleId}>Offset Material / Create MI</h2><p>Record material and MI readiness for project {currentOrder.no}.</p></div>
        <button type="button" className="modal-close" aria-label="Close Offset material request form" onClick={onClose} autoFocus><Icon name="close" size={18} /></button>
      </header>
      <form className="modal-form" onSubmit={save} onChange={() => setSaveError("")}>
        <div className="modal-form-grid">
          <label className="modal-field"><span>Sample Number</span><input value={currentOrder.no} disabled /></label>
          <label className="modal-field"><span>MI Number</span><input value={miNumber} disabled /></label>
          <label className="modal-field"><span>MI Status</span><select value={status} disabled={!canEdit} onChange={(event) => setStatus(event.target.value as MaterialRequestStatus)}>{statuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="modal-field"><span>Requested By</span><input value={latest?.requestedBy ?? (currentOrder.pic === "-" ? "" : currentOrder.pic)} disabled /></label>
          <label className="modal-field"><span>Request Date</span><input type="date" value={requestDate} disabled={!canEdit} onChange={(event) => setRequestDate(event.target.value)} /></label>
          <label className="modal-field"><span>Material</span><input value={masterMaterial || "-"} disabled /></label>
          <label className="modal-field"><span>Gramatur</span><input value={currentOrder.mainData.grammage || "-"} disabled /></label>
          <label className="modal-field"><span>Request Quantity</span><input value={quantity} disabled={!canEdit} onChange={(event) => setQuantity(event.target.value)} /></label>
          <label className="modal-field"><span>Unit</span><select value={unit} disabled={!canEdit} onChange={(event) => setUnit(event.target.value)}>{!unit ? <option value="" disabled>Select unit...</option> : null}<option value="sheet">sheet</option><option value="pcs">pcs</option></select></label>
          <label className="modal-field modal-field-full"><span>Remark</span><textarea value={remark} disabled={!canEdit} onChange={(event) => setRemark(event.target.value)} placeholder="Specifications, priority, or material release notes" rows={3} /></label>
        </div>
        {actionError ? <p className="project-save-error" role={saveError ? "alert" : "status"}>{actionError}</p> : null}
        <footer className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" value="draft" variant="secondary" icon="save" disabled={!canEdit || Boolean(draftError)}>Save MI</Button>
          <Button type="submit" value="continue" icon="arrow" disabled={!canEdit || Boolean(continueError)}>Save &amp; Continue</Button>
        </footer>
      </form>
      {confirmation}
    </section>
  </div>;
}
