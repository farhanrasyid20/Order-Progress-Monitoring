"use client";

import { useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { Order, ProcessHistoryRecord } from "@/types/order";

export type ProjectHistoryModalProps = {
  order: Order;
  onClose: () => void;
};

function displayHistoryTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function historyActivity(record: ProcessHistoryRecord) {
  const labels: Record<string, string> = {
    new_project: "New project created",
    version_up: "Version up created",
    incoming_preparation: "Preparation updated",
    drawing_submitted: "Drawing link submitted",
    design_decision: "Design decision updated",
    tooling_requirement: "Tooling requirement updated",
    rubber_requirement: "Rubber requirement updated",
    standalone_tooling_order: "Standalone tooling order created",
    standalone_rubber_order: "Standalone rubber order created",
    material_request: "Material request / MI updated",
    offset_spk: "Offset SPK created",
    handoff_details_updated: "Handoff details updated",
    project_details_updated: "Project decision details updated",
    project_updated: "Project information updated",
    project_cancelled: "Project cancelled",
    "Design Process": "Moved to Design Process",
  };

  return labels[record.process] ?? record.process;
}

function historyChange(record: ProcessHistoryRecord) {
  if (record.changeSummary) return record.changeSummary;
  if (record.process === "new_project") return "Initial project data created.";
  if (record.remark) return record.remark;
  if (record.status) return `Status: ${record.status}`;

  return "-";
}

/** Shared audit detail for records after they move beyond Incoming Design. */
export function ProjectHistoryModal({ order, onClose }: ProjectHistoryModalProps) {
  const titleId = useId();
  const history = [...order.processHistory].reverse();

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal-dialog history-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="modal-header">
          <div>
            <h2 id={titleId}>Project Details &amp; History</h2>
            <p>{order.no} / {order.customer} / {order.product}</p>
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
                    <td>{record.remark || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="modal-actions history-modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </footer>
      </section>
    </div>
  );
}
