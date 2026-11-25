"use client";

import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { ManualOffsetToolingValues, OffsetToolingMachine, OffsetToolingPriority, OffsetToolingValues, Order, RequirementStatus } from "@/types/order";

const grammageOptions = [60, 70, 80, 100, 120, 150, 175, 210, 230, 260, 300, 310, 400].map((value) => `${value} gsm`);
const priorityOptions: readonly OffsetToolingPriority[] = ["Low", "Medium", "Hard"];
const machineOptions: readonly OffsetToolingMachine[] = ["Auto Haido", "Auto Jingya", "Baozika", "DC Manual", "DC TMZ", "DC Flat"];
const statusOptions: readonly { value: RequirementStatus; label: string }[] = [
  { value: "needed", label: "Needed" }, { value: "ordered", label: "Ordered" }, { value: "received", label: "Received" }, { value: "available", label: "Available / Existing" }, { value: "on_hold", label: "On Hold" }, { value: "repair", label: "Repair" }, { value: "issue", label: "Issue / Reorder" }, { value: "cancelled", label: "Cancelled" },
];
const emptyValues = (): OffsetToolingValues => ({ mcNo: "", status: "needed", grammage: "", openWidth: "", openLength: "", priority: "", machine: "", orderDate: "", receivedDate: "", supplier: "", invoiceNumber: "", price: "", remark: "" });

function ModalFrame({ title, copy, children, onClose, wide = true }: { title: string; copy: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const titleId = useId();
  useEffect(() => { const close = (event: KeyboardEvent) => event.key === "Escape" && onClose(); window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className={`modal-dialog${wide ? " modal-dialog-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId}><header className="modal-header"><div><h2 id={titleId}>{title}</h2><p>{copy}</p></div><button type="button" className="modal-close" aria-label={`Close ${title}`} onClick={onClose} autoFocus><Icon name="close" size={18} /></button></header>{children}</section></div>;
}

type ManualMetadata = Omit<ManualOffsetToolingValues, keyof OffsetToolingValues>;
function ToolingFields({ values, onChange, project, manual, metadata, onMetadataChange }: { values: OffsetToolingValues; onChange: <K extends keyof OffsetToolingValues>(key: K, value: OffsetToolingValues[K]) => void; project?: Order; manual?: boolean; metadata?: ManualMetadata; onMetadataChange?: (key: keyof ManualMetadata, value: string) => void }) {
  const projectValue = (key: keyof ManualMetadata) => !project ? metadata?.[key] ?? "" : key === "customer" ? project.mainData.custName || project.customer : key === "description" ? project.mainData.component || project.product : key === "material" ? project.mainData.boardQua || project.material : key === "imposition" ? project.mainData.imposition ?? "" : project.pic === "-" ? "" : project.pic;
  const metaField = (key: keyof ManualMetadata, label: string) => <label className="modal-field"><span>{label}</span><input value={projectValue(key)} disabled={!manual} onChange={(event) => onMetadataChange?.(key, event.target.value)} /></label>;
  return <div className="modal-form-grid">
    <label className="modal-field"><span>MC No. / Code</span><input value={values.mcNo} onChange={(event) => onChange("mcNo", event.target.value)} /></label>
    {metaField("customer", "Customer")}{metaField("description", "Description")}{metaField("material", "Material")}{metaField("imposition", "Imposition / UP")}
    <label className="modal-field"><span>Gramatur</span><select value={values.grammage} onChange={(event) => onChange("grammage", event.target.value)}><option value="">Select grammage...</option>{grammageOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
    <label className="modal-field"><span>Open Size Width</span><input value={values.openWidth} onChange={(event) => onChange("openWidth", event.target.value)} /></label><label className="modal-field"><span>Open Size Length</span><input value={values.openLength} onChange={(event) => onChange("openLength", event.target.value)} /></label>
    <label className="modal-field"><span>Priority</span><select value={values.priority} onChange={(event) => onChange("priority", event.target.value as OffsetToolingPriority | "")}><option value="">Select priority...</option>{priorityOptions.map((option) => <option key={option}>{option}</option>)}</select></label>{metaField("pic", "Order By / PIC")}
    <label className="modal-field"><span>Machine</span><select value={values.machine} onChange={(event) => onChange("machine", event.target.value as OffsetToolingMachine | "")}><option value="">Select machine...</option>{machineOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
    <label className="modal-field"><span>Status</span><select value={values.status} onChange={(event) => onChange("status", event.target.value as RequirementStatus)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    <label className="modal-field"><span>Order Date</span><input type="date" value={values.orderDate} onChange={(event) => onChange("orderDate", event.target.value)} /></label><label className="modal-field"><span>Received Date</span><input type="date" value={values.receivedDate} onChange={(event) => onChange("receivedDate", event.target.value)} /></label>
    <label className="modal-field"><span>Supplier / Vendor</span><input value={values.supplier} onChange={(event) => onChange("supplier", event.target.value)} /></label><label className="modal-field"><span>Invoice Number</span><input value={values.invoiceNumber} onChange={(event) => onChange("invoiceNumber", event.target.value)} /></label><label className="modal-field"><span>Price</span><input value={values.price} onChange={(event) => onChange("price", event.target.value)} /></label>
    <label className="modal-field modal-field-full"><span>Remark</span><textarea value={values.remark} onChange={(event) => onChange("remark", event.target.value)} rows={3} /></label>
  </div>;
}

export function OffsetToolingAddModal({ onClose }: { onClose: () => void }) {
  const { orders, createOffsetTooling } = useWorkflowOrders(); const [projectId, setProjectId] = useState(""); const [values, setValues] = useState(emptyValues);
  const project = orders.find((order) => order.id === projectId && order.workflow.preparationType === "offset"); const eligible = orders.filter((order) => order.workflow.preparationType === "offset" && order.stage === "offset-plate" && order.workflow.currentStatus !== "cancelled" && !order.offsetToolingId);
  const update = <K extends keyof OffsetToolingValues>(key: K, value: OffsetToolingValues[K]) => setValues((current) => ({ ...current, [key]: value })); const save = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!project || !eligible.some((order) => order.id === project.id)) return; createOffsetTooling(project.id, values); onClose(); };
  return <ModalFrame title="Add Tooling" copy="Create tooling for one active Offset project." onClose={onClose}><form className="modal-form" onSubmit={save}><div className="modal-form-grid"><label className="modal-field modal-field-full"><span>Select Active Project</span><select value={projectId} onChange={(event) => { const id = event.target.value; const selected = eligible.find((order) => order.id === id); setProjectId(id); if (selected) setValues((current) => ({ ...current, mcNo: current.mcNo || selected.mainData.mcNo || selected.no, grammage: current.grammage || selected.mainData.grammage || "" })); }} required><option value="">Select Offset project...</option>{eligible.map((order) => <option key={order.id} value={order.id}>{order.no} - {order.customer} - {order.product}</option>)}</select></label></div><ToolingFields values={values} onChange={update} project={project} /><footer className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" icon="save" disabled={!project}>Save Tooling</Button></footer></form></ModalFrame>;
}

/** Reuses the existing wide Add Tooling shell for a Prepress-only draft. */
export function OffsetToolingDraftModal({ order, draftValues, onSaveDraft, onClose }: { order: Order; draftValues?: OffsetToolingValues; onSaveDraft: (values: OffsetToolingValues) => void; onClose: () => void }) {
  const [values, setValues] = useState<OffsetToolingValues>(() => draftValues ?? { ...emptyValues(), mcNo: order.mainData.mcNo || order.no, grammage: order.mainData.grammage || "" });
  const update = <K extends keyof OffsetToolingValues>(key: K, value: OffsetToolingValues[K]) => setValues((current) => ({ ...current, [key]: value }));
  const save = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSaveDraft(values); };

  return <ModalFrame title={draftValues ? "Edit Tooling" : "Add Tooling"} copy={`Save a Tooling draft for ${order.no}. It will not create an order until Update Preparation.`} onClose={onClose}>
    <form className="modal-form" onSubmit={save}>
      <ToolingFields values={values} onChange={update} project={order} />
      <footer className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" icon="save">Save Tooling Draft</Button></footer>
    </form>
  </ModalFrame>;
}

/** Updates only an existing project-owned Offset tooling order. */
export function OffsetToolingEditModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { createOffsetTooling, updateOffsetTooling } = useWorkflowOrders();
  const record = order.offsetToolingRecords?.find((item) => item.id === order.offsetToolingId) ?? order.offsetToolingRecords?.at(-1);
  const [values, setValues] = useState<OffsetToolingValues>(() => record
    ? { mcNo: record.mcNo, status: record.status ?? "needed", grammage: record.grammage, openWidth: record.openWidth, openLength: record.openLength, priority: record.priority, machine: record.machine, orderDate: record.orderDate, receivedDate: record.receivedDate, supplier: record.supplier, invoiceNumber: record.invoiceNumber, price: record.price, remark: record.remark }
    : { ...emptyValues(), mcNo: order.no, grammage: order.mainData.grammage || "" });
  const completeStatus = values.status === "received" || values.status === "available";
  const completionComplete = Boolean(values.receivedDate && values.supplier.trim() && values.invoiceNumber.trim() && values.price.trim());
  const update = <K extends keyof OffsetToolingValues>(key: K, value: OffsetToolingValues[K]) => setValues((current) => ({ ...current, [key]: value }));

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (completeStatus && !completionComplete) return;
    if (record) updateOffsetTooling(order.id, record.id, values);
    else createOffsetTooling(order.id, values);
    onClose();
  };
  const specificationInput = (label: string, key: "mcNo" | "grammage" | "openWidth" | "openLength", type: "text" | "date" = "text") => <label className="modal-field"><span>{label}</span><input type={type} value={values[key]} disabled={Boolean(values[key])} onChange={(event) => update(key, event.target.value)} /></label>;
  const specificationSelect = <K extends "grammage" | "priority" | "machine">(label: string, key: K, options: readonly string[]) => <label className="modal-field"><span>{label}</span><select value={values[key]} disabled={Boolean(values[key])} onChange={(event) => update(key, event.target.value as OffsetToolingValues[K])}><option value="">Select {label.toLowerCase()}...</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
  const readOnlyField = (label: string, value: string) => <label className="modal-field"><span>{label}</span><input value={value} disabled /></label>;

  return <ModalFrame title="Update Tooling" copy={`Update the saved tooling order for ${order.no}.`} onClose={onClose} wide={false}>
    <form className="modal-form" onSubmit={save}>
      <div className="modal-form-grid">
        {specificationInput("MC No. / Code", "mcNo")}
        {readOnlyField("Customer", order.mainData.custName || order.customer)}
        {readOnlyField("Description", order.mainData.component || order.product)}
        {readOnlyField("Material", order.mainData.boardQua || order.material)}
        {readOnlyField("Imposition / UP", order.mainData.imposition ?? "")}
        {specificationSelect("Gramatur", "grammage", grammageOptions)}
        {specificationInput("Open Size Width", "openWidth")}
        {specificationInput("Open Size Length", "openLength")}
        {specificationSelect("Priority", "priority", priorityOptions)}
        {readOnlyField("Order By / PIC", order.pic === "-" ? "" : order.pic)}
        {specificationSelect("Machine", "machine", machineOptions)}
        {readOnlyField("Order Date", values.orderDate)}
        <label className="modal-field"><span>Status</span><select value={values.status} onChange={(event) => update("status", event.target.value as RequirementStatus)}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="modal-field"><span>Received Date {completeStatus ? "*" : ""}</span><input type="date" value={values.receivedDate} onChange={(event) => update("receivedDate", event.target.value)} required={completeStatus} /></label>
        <label className="modal-field"><span>Supplier / Vendor {completeStatus ? "*" : ""}</span><input value={values.supplier} onChange={(event) => update("supplier", event.target.value)} placeholder="Enter supplier or vendor name" required={completeStatus} /></label>
        <label className="modal-field"><span>Invoice Number {completeStatus ? "*" : ""}</span><input value={values.invoiceNumber} onChange={(event) => update("invoiceNumber", event.target.value)} placeholder="Enter invoice number" required={completeStatus} /></label>
        <label className="modal-field"><span>Price {completeStatus ? "*" : ""}</span><input value={values.price} onChange={(event) => update("price", event.target.value)} placeholder="Amount in IDR" required={completeStatus} /></label>
        <label className="modal-field modal-field-full"><span>Remark</span><textarea value={values.remark} onChange={(event) => update("remark", event.target.value)} placeholder="Enter receiving notes, damage details, or reorder instructions" rows={3} /></label>
      </div>
      <footer className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" icon="save" disabled={completeStatus && !completionComplete} title={completeStatus && !completionComplete ? "Complete Received Date, Supplier, Invoice Number, and Price for a ready tooling status." : undefined}>Update Tooling</Button></footer>
    </form>
  </ModalFrame>;
}
