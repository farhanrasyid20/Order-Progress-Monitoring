"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { Order } from "@/types/order";

export type AfterSampleEditModalProps = {
  order: Order;
  onClose: () => void;
};

/** Feature-owned decision form for a project with a completed sample. */
export function AfterSampleEditModal({
  order,
  onClose,
}: AfterSampleEditModalProps) {
  const titleId = useId();
  const { completeSampleDecision } = useWorkflowOrders();
  const [pic] = useState(order.pic);
  const [decision, setDecision] = useState("Sample Approve / Continue to Production");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    completeSampleDecision(order.id, decision === "Sample Approve / Continue to Production" ? "approve" : decision === "Revision / Return to Design" ? "revision" : "cancel", pic, notes);
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="modal-header">
          <div>
            <h2 id={titleId}>After Sample / Decision</h2>
            <p>Choose the next step for sample {order.no}. Approved samples are marked Completed and moved to History &amp; Archive.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close sample decision form"
            onClick={onClose}
            autoFocus
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-form-grid">
            <label className="modal-field">
              <span>PIC</span>
              <input value={pic} disabled />
            </label>
            <label className="modal-field">
              <span>Decision</span>
              <select value={decision} onChange={(event) => setDecision(event.target.value)}>
                <option>Sample Approve / Continue to Production</option>
                <option>Revision / Return to Design</option>
                <option>Cancel</option>
              </select>
            </label>
            <label className="modal-field modal-field-full">
              <span>Notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Enter the reason for approval, revision, or cancellation"
                rows={3}
              />
            </label>
          </div>
          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Back
            </Button>
            <Button type="submit" icon="check">
              Save Decision
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
