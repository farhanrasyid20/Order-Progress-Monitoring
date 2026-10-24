"use client";

import { useEffect, useId, useState } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { IncomingPreparationDetails } from "./incoming-preparation-details";
import type { PreparationWorkflowUpdate } from "@/types/order";
import { DrawingEditModal } from "@/app/design-drawing/components/drawing-edit-modal";
import { AddProjectModal } from "./add-project-modal";
import { IssueFormModal } from "@/components/issues/issue-form-modal";
import { isActiveProject } from "@/lib/active-project";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { Order, ProcessHistoryRecord, ProjectFormDraft } from "@/types/order";
import {
  getProjectFieldValue,
  isFieldVisible,
  getProjectFormConfig,
} from "./project-form-config";

export type OrderHistoryModalProps = {
  order: Order;
  onClose: () => void;
  onCancel: (order: Order) => void;
  onUpdatePreparation: (orderNo: string, values: PreparationWorkflowUpdate) => void;
};

function displayHistoryTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function historyActivity(record: ProcessHistoryRecord) {
  if (record.process === "new_project") return "New project created";
  if (record.process === "version_up") return "Version up created";
  if (record.process === "incoming_preparation") return "Preparation updated";
  if (record.process === "drawing_submitted") return "Drawing link submitted";
  if (record.process === "design_decision") return "Design decision updated";
  if (record.process === "project_cancelled") return "Project cancelled";
  if (record.process === "Proses Desain" || record.process === "Design Process") {
    return "Moved to Design Process";
  }

  return record.process;
}

function historyChange(record: ProcessHistoryRecord) {
  if (record.changeSummary) return record.changeSummary;
  if (record.process === "new_project") return "Initial project data created.";
  if (record.remark) return record.remark;
  if (record.status) return `Status: ${record.status}`;

  return "-";
}

function historyRemark(record: ProcessHistoryRecord) {
  if (record.changeSummary) return record.remark || "-";
  if (record.process === "new_project") return record.remark || "-";

  return "-";
}

/** Feature-owned audit detail for every project update from the incoming queue. */
export function OrderHistoryModal({ order, onClose, onCancel, onUpdatePreparation }: OrderHistoryModalProps) {
  const titleId = useId();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDrawing, setIsEditingDrawing] = useState(false);
  const [isAddingIssue, setIsAddingIssue] = useState(false);
  const [issueSaved, setIssueSaved] = useState(false);
  const { editProject } = useWorkflowOrders();
  const history = [...order.processHistory].reverse();
  const detailValues: ProjectFormDraft = {
    mainData: order.mainData,
    entryType: order.lineage.entryType,
    previousProjectCode: order.lineage.sourceProjectNo ?? "",
    preparationType: order.workflow.preparationType,
    convertingRoute: order.workflow.convertingRoute ?? "",
    pic: order.pic === "-" ? "" : order.pic,
    projectDate: order.projectDate,
    deadline: order.deadline,
    drawingLink: order.workflow.drawingLink ?? "",
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isEditing && !isEditingDrawing && !isAddingIssue && document.querySelectorAll('[role="dialog"]').length === 1) onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, isEditing, isEditingDrawing, isAddingIssue]);

  useEffect(() => {
    if (!issueSaved) return;
    const timer = window.setTimeout(() => setIssueSaved(false), 3200);
    return () => window.clearTimeout(timer);
  }, [issueSaved]);

  if (isEditingDrawing) {
    return <DrawingEditModal order={order} onClose={() => setIsEditingDrawing(false)} />;
  }

  if (isAddingIssue) {
    return <IssueFormModal projectId={order.id} onClose={() => setIsAddingIssue(false)} onSaved={() => setIssueSaved(true)} />;
  }

  if (isEditing) {
    return <AddProjectModal
      order={order}
      onClose={() => setIsEditing(false)}
      onSubmit={(values) => editProject(order.id, values)}
    />;
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal-dialog history-dialog incoming-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="modal-header">
          <div>
            <h2 id={titleId}>Project Details &amp; History</h2>
            <p>
              {order.no} · {order.customer} · {order.product}
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close project details and history"
            onClick={onClose}
            autoFocus
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="history-modal-body">
          <div className="history-project-summary">
            <div>
              <span>Current Process</span>
              <strong>{order.process}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{order.status}</strong>
            </div>
            <div>
              <span>Last Update</span>
              <strong>{displayHistoryTime(order.updatedAt)}</strong>
            </div>
          </div>

          <IncomingPreparationDetails key={order.id} order={order} onCancel={onCancel} onUpdatePreparation={onUpdatePreparation} />

          {getProjectFormConfig(detailValues).map((section) => (
            <section className="project-form-section" key={section.id}>
              <div className="project-form-section-heading">
                <h3>{section.title}</h3>
              </div>
              <dl className="incoming-detail-grid">
                {section.id === "process-route" ? (
                  <div>
                    <dt>PSR / Code</dt>
                    <dd>{order.no}</dd>
                  </div>
                ) : null}
                {section.fields.filter((field) => isFieldVisible(field, detailValues)).map((field) => {
                  const value = getProjectFieldValue(detailValues, field);
                  const displayValue = value.trim()
                    ? field.options?.find((option) => option.value === value)?.label ?? value
                    : "-";

                  return (
                    <div className={field.fullWidth ? "incoming-detail-full" : undefined} key={field.key}>
                      <dt>{field.label}</dt>
                      <dd>
                        {field.key === "drawingLink" && order.workflow.drawingLink ? (
                          <a
                            className="drawing-link"
                            href={order.workflow.drawingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Icon name="file" size={14} />
                            {order.workflow.drawingFileName ?? "Open Drawing"}
                          </a>
                        ) : displayValue}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}

          <div className="project-form-section-heading">
            <h3>Activity History</h3>
          </div>
          <div className="table-wrap history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Updated By</th>
                  <th>Activity</th>
                  <th>Changes</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record, index) => (
                  <tr key={`${record.date}-${record.process}-${index}`}>
                    <td>{displayHistoryTime(record.date)}</td>
                    <td>{record.user || "System"}</td>
                    <td>{historyActivity(record)}</td>
                    <td>{historyChange(record)}</td>
                    <td>{historyRemark(record)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="modal-actions history-modal-actions">
          {issueSaved ? <div className="toast-message" role="status">Issue saved successfully.</div> : null}
          <Button type="button" icon="plus" variant="secondary" onClick={() => setIsAddingIssue(true)} disabled={!isActiveProject(order)}>
            Add Issue
          </Button>
          {order.stage === "design-progress" && order.workflow.currentStatus !== "cancelled" ? (
            <Button type="button" icon="pen" onClick={() => setIsEditingDrawing(true)}>
              Submit Drawing
            </Button>
          ) : null}
          <Button type="button" icon="pen" onClick={() => setIsEditing(true)} disabled={order.workflow.currentStatus === "cancelled"}>
            Edit
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </footer>
      </section>
    </div>
  );
}

export default OrderHistoryModal;
