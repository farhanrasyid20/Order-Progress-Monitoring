"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { canEditOffsetPrinting } from "@/lib/offset-readiness";
import { useOffsetContinueConfirmation } from "./offset-continue-confirmation";
import type { Order } from "@/types/order";

export type OffsetStageModalProps = {
  order: Order;
  onClose: () => void;
  title: string;
  nextLabel: string;
};

/** Press / Printing handoff to QC Checking. */
export function OffsetStageModal({ order, onClose, title, nextLabel }: OffsetStageModalProps) {
  const titleId = useId();
  const { orders, completeOffsetPrinting } = useWorkflowOrders();
  const [notes, setNotes] = useState("");
  const [saveError, setSaveError] = useState("");
  const currentOrder = orders.find((item) => item.id === order.id);
  const canEdit = Boolean(currentOrder && canEditOffsetPrinting(currentOrder));
  const { requestConfirmation, confirmation } = useOffsetContinueConfirmation(() => {
    const error = completeOffsetPrinting(order.id, notes, order.updatedAt);
    if (error) { setSaveError(error); return; }
    onClose();
  });

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canEdit) requestConfirmation();
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="modal-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            <p>Complete the Offset task for {order.no}, then continue to {nextLabel}.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label={`Close ${title} form`}
            onClick={onClose}
            autoFocus
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-form-grid">
            <label className="modal-field">
              <span>Part Number / Code</span>
              <input value={order.no} disabled />
            </label>
            <label className="modal-field">
              <span>PIC</span>
              <input value={order.pic === "-" ? "" : order.pic} disabled />
            </label>
            <label className="modal-field modal-field-full">
              <span>Target Completion Date</span>
              <input value={order.deadline} disabled />
            </label>
            <label className="modal-field modal-field-full">
              <span>Process Notes</span>
              <textarea
                value={notes}
                disabled={!canEdit}
                onChange={(event) => { setNotes(event.target.value); setSaveError(""); }}
                placeholder="Enter process results, issues, or handoff instructions"
                rows={4}
              />
            </label>
          </div>
          {saveError ? <p className="project-save-error" role="alert">{saveError}</p> : null}
          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" icon="arrow" disabled={!canEdit}>
              Complete &amp; Continue
            </Button>
          </footer>
        </form>
        {confirmation}
      </section>
    </div>
  );
}
