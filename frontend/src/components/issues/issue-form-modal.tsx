"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { useIssues } from "./issue-provider";
import { categories, emptyIssue } from "@/data/issues";
import { isActiveProject } from "@/lib/active-project";
import { issueProjectInfo } from "@/lib/issue-project";
import type { IssueRecord, IssueStatus, IssueFormValues } from "@/types/issue";

type IssueFormModalProps = { editing?: IssueRecord | null; projectId?: string; onClose: () => void; onSaved?: () => void };

export function IssueFormModal({ editing, projectId, onClose, onSaved }: IssueFormModalProps) {
  const titleId = useId();
  const { orders } = useWorkflowOrders();
  const { saveIssue } = useIssues();
  const [form, setForm] = useState<IssueFormValues>(() => editing ? { ...editing } : { ...emptyIssue(), incomingDesignId: projectId ?? null });
  const [error, setError] = useState("");
  const activeOrders = orders.filter(isActiveProject);
  const selectedOrder = orders.find((order) => order.id === form.incomingDesignId);
  const projectOptions = selectedOrder && !isActiveProject(selectedOrder) && editing ? [...activeOrders, selectedOrder] : activeOrders;
  const projectInfo = selectedOrder ? issueProjectInfo(selectedOrder) : form;
  const preparedBy = selectedOrder ? (selectedOrder.pic === "-" ? "" : selectedOrder.pic) : form.preparedBy;
  const isLegacyIssue = Boolean(editing && !editing.incomingDesignId && !form.incomingDesignId);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [onClose]);

  const selectProject = (id: string) => {
    setError("");
    setForm((current) => ({ ...current, incomingDesignId: id || null, source: "", projectCode: "", partCode: "", productDescription: "" }));
  };
  const updateForm = <Key extends keyof IssueFormValues>(key: Key, value: IssueFormValues[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };
  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = saveIssue({ ...form, preparedBy }, editing?.id);
    if (result) { setError(result); return; }
    onSaved?.();
    onClose();
  };

  return (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
          <section className="modal-dialog modal-dialog-wide" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <header className="modal-header">
              <div><h2 id={titleId}>{editing ? "Update Issue" : "Add Issue"}</h2><p>Each save adds an entry to the issue history.</p></div>
              <button type="button" className="modal-close" aria-label="Close issue form" onClick={onClose} autoFocus><Icon name="close" size={18} /></button>
            </header>
            <form className="modal-form" onSubmit={handleSave}>
              <div className="modal-form-grid">
                <label className="modal-field modal-field-full"><span>Incoming Design *</span>
                  <select value={form.incomingDesignId ?? ""} disabled={Boolean(projectId || editing)} required={!editing || Boolean(editing.incomingDesignId)} onChange={(event) => selectProject(event.target.value)}>
                    <option value="">{editing && !editing.incomingDesignId ? "Legacy issue without a project reference" : "Select Incoming Design..."}</option>
                    {projectOptions.map((order) => <option key={order.id} value={order.id}>{order.no} — {order.customer} — {order.product}</option>)}
                  </select>
                </label>
                {!activeOrders.length && !editing ? <small className="project-form-error">No active Incoming Design projects available.</small> : null}
                <label className="modal-field"><span>PSR / Code</span><input value={projectInfo.projectCode} readOnly /></label>
                <label className="modal-field"><span>Source / Customer / Machine</span><input value={projectInfo.source} readOnly={!isLegacyIssue} required onChange={(event) => updateForm("source", event.target.value)} /></label>
                <label className="modal-field"><span>Part No / Code</span><input value={projectInfo.partCode} readOnly={!isLegacyIssue} onChange={(event) => updateForm("partCode", event.target.value)} /></label>
                <label className="modal-field"><span>Description</span><input value={projectInfo.productDescription} readOnly={!isLegacyIssue} onChange={(event) => updateForm("productDescription", event.target.value)} /></label>
                <label className="modal-field"><span>Date Found</span><input type="date" value={form.dateFound} onChange={(event) => updateForm("dateFound", event.target.value)} required /></label>
                <label className="modal-field modal-field-full"><span>Description of Error</span><textarea value={form.errorDescription} onChange={(event) => updateForm("errorDescription", event.target.value)} rows={2} required /></label>
                <label className="modal-field"><span>Type of Error</span><select value={form.category} onChange={(event) => updateForm("category", event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label className="modal-field"><span>Prepared By</span><input value={preparedBy} readOnly={Boolean(selectedOrder)} onChange={(event) => updateForm("preparedBy", event.target.value)} required /></label>
                <label className="modal-field"><span>Found By</span><select value={form.foundBy} onChange={(event) => updateForm("foundBy", event.target.value)} required>
                  <option value="">Select user...</option>
                  {form.foundBy && !["Ihsan", "Aldo", "Dimas"].includes(form.foundBy) ? <option value={form.foundBy}>{form.foundBy}</option> : null}
                  {["Ihsan", "Aldo", "Dimas"].map(name => <option key={name} value={name}>{name}</option>)}
                </select></label>
                <label className="modal-field"><span>Target Date</span><input type="date" value={form.targetDate} onChange={(event) => updateForm("targetDate", event.target.value)} /></label>
                <label className="modal-field"><span>Status</span><select value={form.status} onChange={(event) => updateForm("status", event.target.value as IssueStatus)}><option>Open</option><option>Closed</option></select></label>
                <label className="modal-field"><span>Date Closed</span><input type="date" value={form.dateClosed} onChange={(event) => updateForm("dateClosed", event.target.value)} disabled={form.status !== "Closed"} /></label>
                <label className="modal-field modal-field-full"><span>Action / Correction</span><textarea value={form.action} onChange={(event) => updateForm("action", event.target.value)} rows={2} required /></label>
                <label className="modal-field modal-field-full"><span>Remark</span><textarea value={form.remark} onChange={(event) => updateForm("remark", event.target.value)} rows={2} /></label>
              </div>
              {error ? <p className="project-form-error" role="alert">{error}</p> : null}
              <footer className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" icon="save">Save Issue</Button></footer>
            </form>
          </section>
        </div>

  );
}
