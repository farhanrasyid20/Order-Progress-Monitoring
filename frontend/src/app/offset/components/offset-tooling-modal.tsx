"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { defaultOffsetPreparationStatus, isOffsetPreparationStatus, offsetToolingStatus } from "@/lib/offset-preparation-status";
import { ToolingStatusField } from "./offset-tooling-management-modals";
import type { OffsetToolingMachine, OffsetToolingPriority, OffsetToolingRecord, OffsetToolingValues, Order } from "@/types/order";

const grammageOptions = [60, 70, 80, 100, 120, 150, 175, 210, 230, 260, 300, 310, 400]
  .map((value) => `${value} gsm`);
const priorityOptions: readonly OffsetToolingPriority[] = ["Low", "Medium", "Hard"];
const machineOptions: readonly OffsetToolingMachine[] = ["Auto Haido", "Auto Jingya", "Baozika", "DC Manual", "DC TMZ", "DC Flat"];

/** Dedicated Offset Tooling / Plate form. Its values intentionally stay outside project mainData. */
export function OffsetToolingModal({ order, onClose, tooling, mode = "edit", draftValues, onSaveDraft }: {
  order: Order;
  onClose: () => void;
  tooling?: OffsetToolingRecord;
  mode?: "create" | "edit" | "draft";
  draftValues?: OffsetToolingValues;
  onSaveDraft?: (values: OffsetToolingValues) => void;
}) {
  const titleId = useId();
  const { createOffsetTooling, updateOffsetTooling } = useWorkflowOrders();
  const saved = mode === "edit" ? tooling : undefined;
  const savedStatus = offsetToolingStatus(draftValues?.status ?? saved?.status ?? defaultOffsetPreparationStatus);
  const [status, setStatus] = useState<OffsetToolingValues["status"] | "">(() => isOffsetPreparationStatus(savedStatus) ? savedStatus : "");
  const [values, setValues] = useState<Omit<OffsetToolingValues, "status">>({
    mcNo: draftValues?.mcNo ?? saved?.mcNo ?? order.mainData.mcNo ?? order.no,
    grammage: draftValues?.grammage ?? saved?.grammage ?? order.mainData.grammage ?? "",
    priority: draftValues?.priority ?? saved?.priority ?? "",
    machine: draftValues?.machine ?? saved?.machine ?? "",
    orderDate: draftValues?.orderDate ?? saved?.orderDate ?? "",
    receivedDate: draftValues?.receivedDate ?? saved?.receivedDate ?? "",
    supplier: draftValues?.supplier ?? saved?.supplier ?? "",
    invoiceNumber: draftValues?.invoiceNumber ?? saved?.invoiceNumber ?? "",
    price: draftValues?.price ?? saved?.price ?? "",
    remark: draftValues?.remark ?? saved?.remark ?? "",
  });

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const update = <Key extends keyof typeof values>(key: Key, value: OffsetToolingValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!status) return;
    const input = { ...values, status };
    if (mode === "draft") onSaveDraft?.(input);
    else if (mode === "create") createOffsetTooling(order.id, input);
    else if (saved) updateOffsetTooling(order.id, saved.id, input);
    onClose();
  };

  const customer = order.mainData.custName || order.customer;
  const component = order.mainData.component || order.product;
  const material = order.mainData.boardQua || order.material;

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="modal-header">
        <div>
          <h2 id={titleId}>{mode === "create" || (mode === "draft" && !draftValues) ? "Add Tooling / Plate" : "Edit Tooling / Plate"}</h2>
          <p>{mode === "draft" ? `Save a Tooling draft for ${order.no}; it will not create an order until the Prepress plan is updated.` : `Record Offset tooling and plate order details for ${order.no}.`}</p>
        </div>
        <button type="button" className="modal-close" aria-label="Close Tooling / Plate form" onClick={onClose} autoFocus>
          <Icon name="close" size={18} />
        </button>
      </header>

      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="modal-form-grid">
          <label className="modal-field"><span>MC No. / Code</span><input value={values.mcNo} onChange={(event) => update("mcNo", event.target.value)} /></label>
          <label className="modal-field"><span>Customer</span><input value={customer} disabled /></label>
          <label className="modal-field"><span>Description</span><input value={component} disabled /></label>
          <label className="modal-field"><span>Material</span><input value={material} disabled /></label>
          <label className="modal-field"><span>Imposition / UP</span><input value={order.mainData.imposition ?? ""} disabled /></label>
          <label className="modal-field"><span>Gramatur</span><select value={values.grammage} onChange={(event) => update("grammage", event.target.value)}><option value="">Select grammage...</option>{grammageOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
          <label className="modal-field"><span>Priority</span><select value={values.priority} onChange={(event) => update("priority", event.target.value as OffsetToolingPriority | "")}><option value="">Select priority...</option>{priorityOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
          <label className="modal-field"><span>PIC</span><input value={order.pic === "-" ? "" : order.pic} disabled /></label>
          <label className="modal-field"><span>Machine</span><select value={values.machine} onChange={(event) => update("machine", event.target.value as OffsetToolingMachine | "")}><option value="">Select machine...</option>{machineOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
          <ToolingStatusField value={status} savedStatus={savedStatus} onChange={setStatus} />
          <label className="modal-field"><span>Order Date</span><input type="date" value={values.orderDate} onChange={(event) => update("orderDate", event.target.value)} /></label>
          <label className="modal-field"><span>Received Date</span><input type="date" value={values.receivedDate} onChange={(event) => update("receivedDate", event.target.value)} /></label>
          <label className="modal-field"><span>Supplier</span><input value={values.supplier} onChange={(event) => update("supplier", event.target.value)} /></label>
          <label className="modal-field"><span>Invoice Number</span><input value={values.invoiceNumber} onChange={(event) => update("invoiceNumber", event.target.value)} /></label>
          <label className="modal-field"><span>Price</span><input value={values.price} onChange={(event) => update("price", event.target.value)} /></label>
          <label className="modal-field modal-field-full"><span>Remark</span><textarea value={values.remark} onChange={(event) => update("remark", event.target.value)} placeholder="Tooling, plate, or supplier notes" rows={3} /></label>
        </div>
        <footer className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" icon="save" disabled={!status}>{mode === "draft" ? "Save Tooling Draft" : "Save Tooling / Plate"}</Button>
        </footer>
      </form>
    </section>
  </div>;
}
