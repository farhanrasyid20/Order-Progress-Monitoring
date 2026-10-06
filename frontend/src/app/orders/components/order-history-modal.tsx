"use client";

import { useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { Order, ProcessHistoryRecord } from "@/types/order";

export type OrderHistoryModalProps = {
  order: Order;
  onClose: () => void;
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
export function OrderHistoryModal({ order, onClose }: OrderHistoryModalProps) {
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
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </footer>
      </section>
    </div>
  );
}

export default OrderHistoryModal;
