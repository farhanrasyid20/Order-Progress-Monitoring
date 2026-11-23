"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { DetailGrid } from "@/components/workflow/requirement-details";
import type { ManualOffsetToolingValues, OffsetToolingCatalogRecord, OffsetToolingMachine, OffsetToolingPriority, OffsetToolingValues, Order } from "@/types/order";

const grammageOptions = [60, 70, 80, 100, 120, 150, 175, 210, 230, 260, 300, 310, 400].map((value) => `${value} gsm`);
const priorityOptions: readonly OffsetToolingPriority[] = ["Low", "Medium", "Hard"];
const machineOptions: readonly OffsetToolingMachine[] = ["Auto Haido", "Auto Jingya", "Baozika", "DC Manual", "DC TMZ", "DC Flat"];
const emptyToolingValues: OffsetToolingValues = { mcNo: "", grammage: "", openWidth: "", openLength: "", priority: "", machine: "", orderDate: "", receivedDate: "", supplier: "", invoiceNumber: "", price: "", remark: "" };

function ModalFrame({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const titleId = useId();
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="modal-header"><div><h2 id={titleId}>{title}</h2><p>Select an existing Offset project. This does not create a new project or change its workflow stage.</p></div><button type="button" className="modal-close" aria-label={`Close ${title}`} onClick={onClose} autoFocus><Icon name="close" size={18} /></button></header>
      {children}
    </section>
  </div>;
}

/** Wide Add form supports either an Offset project or independent manual tooling. */
export function OffsetToolingAddModal({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const { orders, createOffsetTooling, createManualOffsetTooling } = useWorkflowOrders();
  const [source, setSource] = useState<"existing" | "manual">("existing");
  const [projectId, setProjectId] = useState("");
  const [values, setValues] = useState<OffsetToolingValues>(emptyToolingValues);
  const [manual, setManual] = useState<Omit<ManualOffsetToolingValues, keyof OffsetToolingValues>>({ customer: "", description: "", material: "", imposition: "", pic: "" });
  const existing = source === "existing";
  const project = orders.find((order) => order.id === projectId && order.workflow.preparationType === "offset");
  const eligibleProjects = orders.filter((order) => order.workflow.preparationType === "offset" && order.stage === "offset-plate" && order.workflow.currentStatus !== "cancelled");
  const customer = existing ? project?.mainData.custName || project?.customer || "" : manual.customer;
  const description = existing ? project?.mainData.component || project?.product || "" : manual.description;
  const material = existing ? project?.mainData.boardQua || project?.material || "" : manual.material;
  const imposition = existing ? project?.mainData.imposition ?? "" : manual.imposition;
  const pic = existing ? project?.pic === "-" ? "" : project?.pic ?? "" : manual.pic;

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const update = <Key extends keyof OffsetToolingValues>(key: Key, value: OffsetToolingValues[Key]) => setValues((current) => ({ ...current, [key]: value }));
  const updateManual = (key: keyof typeof manual, value: string) => setManual((current) => ({ ...current, [key]: value }));
  const save = () => {
    if (existing) { if (!project) return; createOffsetTooling(project.id, values); }
    else createManualOffsetTooling({ ...values, customer, description, material, imposition, pic });
    onClose();
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal-dialog modal-dialog-wide" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="modal-header"><div><h2 id={titleId}>Add Tooling / Plate</h2><p>Register tooling from an existing Offset project or as an independent manual entry.</p></div><button type="button" className="modal-close" aria-label="Close Add Tooling form" onClick={onClose} autoFocus><Icon name="close" size={18} /></button></header>
      <form className="modal-form" onSubmit={(event) => { event.preventDefault(); save(); }}>
        <div className="modal-form-grid">
          <label className="modal-field modal-field-full"><span>Order Source</span><select value={source} onChange={(event) => { const next = event.target.value as "existing" | "manual"; setSource(next); if (next === "manual") setProjectId(""); }}><option value="existing">Existing Project / Sample Number</option><option value="manual">No Sample Number Yet (Manual Entry)</option></select></label>
          {existing ? <label className="modal-field modal-field-full"><span>Existing Project / Sample Number</span><select value={projectId} onChange={(event) => setProjectId(event.target.value)} required><option value="">Select Offset project...</option>{eligibleProjects.map((order) => <option key={order.id} value={order.id}>{order.no} - {order.customer} - {order.product}</option>)}</select>{!eligibleProjects.length ? <small className="project-form-error">No active Offset Tooling / Plate projects are available.</small> : null}</label> : null}
          <label className="modal-field"><span>MC No. / Tooling Code</span><input value={values.mcNo} onChange={(event) => update("mcNo", event.target.value)} /></label>
          <label className="modal-field"><span>Customer</span><input value={customer} disabled={existing} onChange={(event) => updateManual("customer", event.target.value)} /></label>
          <label className="modal-field"><span>Description</span><input value={description} disabled={existing} onChange={(event) => updateManual("description", event.target.value)} /></label>
          <label className="modal-field"><span>Material</span><input value={material} disabled={existing} onChange={(event) => updateManual("material", event.target.value)} /></label>
          <label className="modal-field"><span>Imposition / UP</span><input value={imposition} disabled={existing} onChange={(event) => updateManual("imposition", event.target.value)} /></label>
          <label className="modal-field"><span>Gramatur</span><select value={values.grammage} onChange={(event) => update("grammage", event.target.value)}><option value="">Select grammage...</option>{grammageOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="modal-field"><span>Open Size Width</span><input value={values.openWidth} onChange={(event) => update("openWidth", event.target.value)} /></label>
          <label className="modal-field"><span>Open Size Length</span><input value={values.openLength} onChange={(event) => update("openLength", event.target.value)} /></label>
          <label className="modal-field"><span>Priority</span><select value={values.priority} onChange={(event) => update("priority", event.target.value as OffsetToolingPriority | "")}><option value="">Select priority...</option>{priorityOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="modal-field"><span>PIC</span><input value={pic} disabled={existing} onChange={(event) => updateManual("pic", event.target.value)} /></label>
          <label className="modal-field"><span>Machine</span><select value={values.machine} onChange={(event) => update("machine", event.target.value as OffsetToolingMachine | "")}><option value="">Select machine...</option>{machineOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="modal-field"><span>Order Date</span><input type="date" value={values.orderDate} onChange={(event) => update("orderDate", event.target.value)} /></label>
          <label className="modal-field"><span>Received Date</span><input type="date" value={values.receivedDate} onChange={(event) => update("receivedDate", event.target.value)} /></label>
          <label className="modal-field"><span>Supplier</span><input value={values.supplier} onChange={(event) => update("supplier", event.target.value)} /></label>
          <label className="modal-field"><span>Invoice Number</span><input value={values.invoiceNumber} onChange={(event) => update("invoiceNumber", event.target.value)} /></label>
          <label className="modal-field"><span>Price</span><input value={values.price} onChange={(event) => update("price", event.target.value)} /></label>
          <label className="modal-field modal-field-full"><span>Remark</span><textarea value={values.remark} onChange={(event) => update("remark", event.target.value)} rows={3} /></label>
        </div>
        <footer className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" icon="save" disabled={existing && !project}>Save Tooling</Button></footer>
      </form>
    </section>
  </div>;
}

function isCompatibleTooling(order: Order, tooling: { customer: string; material: string; imposition: string }) {
  const matches = (left: string, right: string) => !left.trim() || !right.trim() || left.trim().toLowerCase() === right.trim().toLowerCase();
  return matches(tooling.customer, order.mainData.custName || order.customer) &&
    matches(tooling.material, order.mainData.boardQua || order.material) &&
    matches(tooling.imposition, order.mainData.imposition ?? "");
}

/** Project Edit links an existing compatible catalog record; it never creates or edits one. */
export function OffsetToolingSelectModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { selectOffsetTooling, offsetToolingCatalog } = useWorkflowOrders();
  const records = offsetToolingCatalog.filter((record) => isCompatibleTooling(order, record));
  const [toolingId, setToolingId] = useState(order.offsetToolingId && records.some((record) => record.id === order.offsetToolingId) ? order.offsetToolingId : "");
  const selected = records.find((record) => record.id === toolingId);
  return <ModalFrame title="Select Tooling" onClose={onClose}><div className="modal-form">
    <label className="modal-field"><span>Tooling</span><select value={toolingId} onChange={(event) => setToolingId(event.target.value)} disabled={!records.length}><option value="">Select tooling...</option>{records.map((record) => <option key={record.id} value={record.id}>{record.mcNo || "No MC No."} - {record.customer || "No customer"}</option>)}</select></label>
    {selected ? <section className="requirement-detail-section" aria-label="Selected tooling summary"><h3>Selected Tooling</h3><DetailGrid fields={[["MC No. / Tooling Code", selected.mcNo], ["Customer", selected.customer], ["Description", selected.description], ["Material", selected.material], ["Imposition / UP", selected.imposition], ["Gramatur", selected.grammage], ["Open Size", [selected.openWidth, selected.openLength].filter(Boolean).join(" x ")], ["Machine", selected.machine], ["Supplier", selected.supplier]]} /></section> : <p className="project-form-error">No compatible tooling is available. Create one with + Add Tooling first.</p>}
    <footer className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" icon="save" disabled={!selected} onClick={() => { if (selected) selectOffsetTooling(order.id, selected.id); onClose(); }}>Save Selection</Button></footer>
  </div></ModalFrame>;
}

/** Catalog-level edit is intentionally separate from a project's Select Tooling action. */
export function OffsetToolingRecordPickerModal({ onClose }: { onClose: () => void }) {
  const { offsetToolingCatalog } = useWorkflowOrders();
  const [toolingId, setToolingId] = useState("");
  const selected = offsetToolingCatalog.find((record) => record.id === toolingId);
  if (selected) return <OffsetToolingRecordEditModal record={selected} onClose={onClose} />;
  return <ModalFrame title="Edit Tooling Record" onClose={onClose}><div className="modal-form">
    <label className="modal-field"><span>Tooling Record</span><select value={toolingId} onChange={(event) => setToolingId(event.target.value)}><option value="">Select tooling record...</option>{offsetToolingCatalog.map((record) => <option key={record.id} value={record.id}>{record.mcNo || "No MC No."} - {record.customer || "No customer"}</option>)}</select></label>
    {!offsetToolingCatalog.length ? <p className="project-form-error">No tooling record is available. Create one with + Add Tooling first.</p> : null}
    <footer className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button></footer>
  </div></ModalFrame>;
}

function ToolingRecordFields({ values, onChange }: { values: OffsetToolingValues; onChange: <Key extends keyof OffsetToolingValues>(key: Key, value: OffsetToolingValues[Key]) => void }) {
  return <div className="modal-form-grid">
    <label className="modal-field"><span>MC No. / Tooling Code</span><input value={values.mcNo} onChange={(event) => onChange("mcNo", event.target.value)} /></label>
    <label className="modal-field"><span>Gramatur</span><select value={values.grammage} onChange={(event) => onChange("grammage", event.target.value)}><option value="">Select grammage...</option>{grammageOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
    <label className="modal-field"><span>Open Size Width</span><input value={values.openWidth} onChange={(event) => onChange("openWidth", event.target.value)} /></label>
    <label className="modal-field"><span>Open Size Length</span><input value={values.openLength} onChange={(event) => onChange("openLength", event.target.value)} /></label>
    <label className="modal-field"><span>Priority</span><select value={values.priority} onChange={(event) => onChange("priority", event.target.value as OffsetToolingPriority | "")}><option value="">Select priority...</option>{priorityOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
    <label className="modal-field"><span>Machine</span><select value={values.machine} onChange={(event) => onChange("machine", event.target.value as OffsetToolingMachine | "")}><option value="">Select machine...</option>{machineOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
    <label className="modal-field"><span>Order Date</span><input type="date" value={values.orderDate} onChange={(event) => onChange("orderDate", event.target.value)} /></label>
    <label className="modal-field"><span>Received Date</span><input type="date" value={values.receivedDate} onChange={(event) => onChange("receivedDate", event.target.value)} /></label>
    <label className="modal-field"><span>Supplier</span><input value={values.supplier} onChange={(event) => onChange("supplier", event.target.value)} /></label>
    <label className="modal-field"><span>Invoice Number</span><input value={values.invoiceNumber} onChange={(event) => onChange("invoiceNumber", event.target.value)} /></label>
    <label className="modal-field"><span>Price</span><input value={values.price} onChange={(event) => onChange("price", event.target.value)} /></label>
    <label className="modal-field modal-field-full"><span>Remark</span><textarea value={values.remark} onChange={(event) => onChange("remark", event.target.value)} rows={3} /></label>
  </div>;
}

export function OffsetToolingRecordEditModal({ record, onClose }: { record: OffsetToolingCatalogRecord; onClose: () => void }) {
  const titleId = useId();
  const { orders, updateOffsetTooling, updateManualOffsetTooling } = useWorkflowOrders();
  const sourceProject = record.sourceProjectId ? orders.find((order) => order.id === record.sourceProjectId) : undefined;
  const manualRecord = !record.sourceProjectId;
  const [values, setValues] = useState<OffsetToolingValues>({ mcNo: record.mcNo, grammage: record.grammage, openWidth: record.openWidth, openLength: record.openLength, priority: record.priority, machine: record.machine, orderDate: record.orderDate, receivedDate: record.receivedDate, supplier: record.supplier, invoiceNumber: record.invoiceNumber, price: record.price, remark: record.remark });
  const [metadata, setMetadata] = useState({ customer: record.customer, description: record.description, material: record.material, imposition: record.imposition, pic: record.pic });
  const update = <Key extends keyof OffsetToolingValues>(key: Key, value: OffsetToolingValues[Key]) => setValues((current) => ({ ...current, [key]: value }));
  const save = () => {
    if (manualRecord) updateManualOffsetTooling(record.id, { ...values, ...metadata });
    else if (sourceProject) updateOffsetTooling(sourceProject.id, record.id, values);
    onClose();
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal-dialog modal-dialog-wide" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="modal-header"><div><h2 id={titleId}>Edit Tooling Record</h2><p>Update tooling order and receiving information without changing project data or workflow.</p></div><button type="button" className="modal-close" aria-label="Close Edit Tooling Record" onClick={onClose} autoFocus><Icon name="close" size={18} /></button></header>
      <form className="modal-form" onSubmit={(event) => { event.preventDefault(); save(); }}>
        {manualRecord ? <div className="modal-form-grid" style={{ marginBottom: 15 }}>
          {(["customer", "description", "material", "imposition", "pic"] as const).map((key) => <label className="modal-field" key={key}><span>{key === "pic" ? "PIC" : key === "imposition" ? "Imposition / UP" : key[0].toUpperCase() + key.slice(1)}</span><input value={metadata[key]} onChange={(event) => setMetadata((current) => ({ ...current, [key]: event.target.value }))} /></label>)}
        </div> : <div className="modal-history-note">Project source: {sourceProject?.no ?? "Legacy project"} / {record.customer}</div>}
        <ToolingRecordFields values={values} onChange={update} />
        <footer className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" icon="save">Save Tooling Record</Button></footer>
      </form>
    </section>
  </div>;
}
